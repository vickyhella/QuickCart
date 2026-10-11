import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const { id } = await context.params
  try {
    const [orders, pins, media] = await Promise.all([
      payload.find({ collection: 'orders', where: { 'items.product': { equals: id } }, limit: 1, depth: 0, overrideAccess: true }),
      payload.find({ collection: 'pinterest-posts', where: { product: { equals: id } }, limit: 1, depth: 0, overrideAccess: true }),
      payload.find({ collection: 'media', where: { product: { equals: id } }, limit: 1, depth: 0, overrideAccess: true }),
    ])
    const referenceCount = orders.totalDocs + pins.totalDocs + media.totalDocs
    const force = new URL(request.url).searchParams.get('force') === 'true'
    if (referenceCount > 0 && !force) {
      return NextResponse.json({ requiresForce: true, referenceCount, references: { orders: orders.totalDocs, pinterestPosts: pins.totalDocs, media: media.totalDocs }, error: 'This product is referenced by other records.' }, { status: 409 })
    }
    await payload.delete({ collection: 'products', id, overrideAccess: true })
    return NextResponse.json({ success: true, referenceCount })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not delete this product.' }, { status: 500 })
  }
}
