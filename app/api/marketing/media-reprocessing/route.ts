import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { hasReprocessableSource, reprocessMediaFromOriginal } from '@/lib/reprocess-media'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  const [media, settings] = await Promise.all([
    payload.find({ collection: 'media', limit: 10000, pagination: false, depth: 1, sort: 'createdAt', overrideAccess: true }),
    payload.findGlobal({ slug: 'marketing-settings', overrideAccess: true }),
  ])
  const images = (media.docs as any[]).filter((item) => !item.studioTemporary && hasReprocessableSource(item)).map((item) => ({ id: String(item.id), filename: String(item.filename || item.title || item.id) }))
  return NextResponse.json({ images, quality: Math.max(1, Math.min(100, Number(settings.webpQuality || 82))) })
}

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  let body: { ids?: unknown; quality?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }) }
  const ids = Array.isArray(body.ids) ? [...new Set(body.ids.map(String))] : []
  if (!ids.length || ids.length > 10) return NextResponse.json({ error: 'Choose between 1 and 10 images per batch.' }, { status: 400 })
  if (body.quality !== undefined) {
    const quality = Number(body.quality)
    if (!Number.isInteger(quality) || quality < 1 || quality > 100) return NextResponse.json({ error: 'Image quality must be a whole number from 1 to 100.' }, { status: 400 })
    await payload.updateGlobal({ slug: 'marketing-settings', data: { webpQuality: quality }, user, overrideAccess: false })
  }

  const results: Array<{ id: string; success: boolean; error?: string }> = []
  for (const id of ids) {
    try {
      await reprocessMediaFromOriginal(payload, id)
      results.push({ id, success: true })
    } catch (error) {
      results.push({ id, success: false, error: error instanceof Error ? error.message : 'Image reprocessing failed.' })
    }
  }
  return NextResponse.json({ results })
}
