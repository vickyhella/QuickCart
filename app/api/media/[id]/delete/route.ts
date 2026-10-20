import { isAdminUser } from '@/lib/admin-access'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!isAdminUser(user)) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const deleteOriginal = body.deleteOriginal === true
    const media: any = await payload.findByID({ collection: 'media', id, depth: 0, overrideAccess: true })
    const originalID = media.sourceOriginal && typeof media.sourceOriginal === 'object' ? media.sourceOriginal.id : media.sourceOriginal

    const products = await payload.find({ collection: 'products', limit: 10000, pagination: false, depth: 0, overrideAccess: true })
    const relationID = (value: any) => String(value && typeof value === 'object' ? value.id : value ?? '')
    const references = (products.docs as any[]).filter((product) =>
      relationID(product.featuredImage) === String(id) ||
      (Array.isArray(product.gallery) && product.gallery.some((item: any) => relationID(item) === String(id))) ||
      (Array.isArray(product.variants) && product.variants.some((variant: any) => relationID(variant.image) === String(id))),
    )
    const pins = await payload.find({ collection: 'pinterest-posts', where: { imageMedia: { equals: String(id) } }, limit: 10000, pagination: false, depth: 0, overrideAccess: true })
    if (references.length || pins.docs.length) {
      return NextResponse.json({ error: `This image is still used by ${references.length} product(s) or ${pins.docs.length} Pinterest post(s). Remove those references first.` }, { status: 409 })
    }

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
