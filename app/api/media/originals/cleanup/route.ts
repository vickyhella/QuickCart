import config from '@payload-config'
import { getPayload } from 'payload'
import { getOriginalUsage } from '@/lib/original-media-cleanup'

async function getSnapshot(payload: Awaited<ReturnType<typeof getPayload>>) {
  const [originals, media, products, pins] = await Promise.all([
    payload.find({ collection: 'media-originals', limit: 10000, pagination: false, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'media', limit: 10000, pagination: false, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'products', limit: 10000, pagination: false, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'pinterest-posts', limit: 10000, pagination: false, depth: 0, overrideAccess: true }),
  ])
  return { originals: originals.docs, media: media.docs, usage: getOriginalUsage(originals.docs, media.docs, products.docs, pins.docs) }
}

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ error: 'Authentication required.' }, { status: 401 })
  try {
    const { usage } = await getSnapshot(payload)
    return Response.json({ total: usage.length, unreferenced: usage.filter((item) => !item.referenced).length, referenced: usage.filter((item) => item.referenced) })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Could not inspect original images.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ error: 'Authentication required.' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const includeReferenced = body.includeReferenced === true

  try {
    // Recheck all references immediately before deletion so stale UI analysis cannot authorize it.
    const { originals, media, usage } = await getSnapshot(payload)
    const selected = usage.filter((item) => includeReferenced || !item.referenced)
    const deleted: string[] = []
    const failures: string[] = []
    for (const item of selected) {
      try {
        const linked = media.filter((record: any) => String(record.sourceOriginal && typeof record.sourceOriginal === 'object' ? record.sourceOriginal.id : record.sourceOriginal ?? '') === String(item.id))
        for (const record of linked) {
          await payload.update({ collection: 'media', id: record.id, data: { sourceOriginal: null }, overrideAccess: true })
        }
        await payload.delete({ collection: 'media-originals', id: item.id, overrideAccess: true })
        deleted.push(String(item.id))
      } catch (error) {
        failures.push(`${item.filename}: ${error instanceof Error ? error.message : 'delete failed'}`)
      }
    }

    return Response.json({ deleted: deleted.length, keptReferenced: includeReferenced ? 0 : usage.filter((item) => item.referenced).length, failures, remaining: originals.length - deleted.length })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Could not delete original images.' }, { status: 500 })
  }
}
