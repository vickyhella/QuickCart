import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const deleteOriginal = body.deleteOriginal === true
    const media: any = await payload.findByID({ collection: 'media', id, depth: 0, overrideAccess: true })
    const originalID = media.sourceOriginal && typeof media.sourceOriginal === 'object' ? media.sourceOriginal.id : media.sourceOriginal

    if (deleteOriginal && originalID) {
      const references = await payload.find({
        collection: 'media',
        where: { sourceOriginal: { equals: String(originalID) } },
        limit: 10000,
        pagination: false,
        depth: 0,
        overrideAccess: true,
      })
      const otherReferences = references.docs.filter((item: any) => String(item.id) !== String(id))
      if (otherReferences.length) {
        return NextResponse.json({ error: `The original is still used by ${otherReferences.length} other media record(s). The WebP and original were kept.` }, { status: 409 })
      }
    }

    await payload.delete({ collection: 'media', id, overrideAccess: true })
    if (deleteOriginal && originalID) {
      await payload.delete({ collection: 'media-originals', id: originalID, overrideAccess: true })
    }
    return NextResponse.json({ success: true, deletedOriginal: Boolean(deleteOriginal && originalID) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not delete this media item.' }, { status: 500 })
  }
}
