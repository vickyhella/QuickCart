import config from '@/payload.config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await getPayload({ config })
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const old = await payload.find({ collection: 'media', where: { and: [{ createdAt: { less_than: cutoff } }, { studioTemporary: { equals: true } }] }, limit: 1000, pagination: false, depth: 0, overrideAccess: true })
  const products = await payload.find({ collection: 'products', limit: 10000, pagination: false, depth: 0, overrideAccess: true })
  const relationID = (value: any) => String(value && typeof value === 'object' ? value.id : value ?? '')
  let deleted = 0

  for (const media of old.docs as any[]) {
    if (media.product) continue
    const id = String(media.id)
    const usedByProduct = (products.docs as any[]).some((product) =>
      relationID(product.featuredImage) === id ||
      (Array.isArray(product.gallery) && product.gallery.some((item: any) => relationID(item) === id)) ||
      (Array.isArray(product.variants) && product.variants.some((variant: any) => relationID(variant.image) === id)),
    )
    if (usedByProduct) continue
    const pins = await payload.find({ collection: 'pinterest-posts', where: { imageMedia: { equals: id } }, limit: 1, depth: 0, overrideAccess: true })
    if (pins.docs.length) continue
    const originalID = relationID(media.sourceOriginal)
    await payload.delete({ collection: 'media', id: media.id, overrideAccess: true })
    if (originalID) {
      const other = await payload.find({ collection: 'media', where: { sourceOriginal: { equals: originalID } }, limit: 1, depth: 0, overrideAccess: true })
      if (!other.docs.length) await payload.delete({ collection: 'media-originals', id: originalID, overrideAccess: true }).catch(() => undefined)
    }
    deleted += 1
  }

  return Response.json({ deleted })
}
