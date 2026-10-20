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
    const product = await payload.findByID({ collection: 'products', id, depth: 0, overrideAccess: true })
    const body = await request.json()
    const mediaIDs: string[] = Array.isArray(body.mediaIDs) ? [...new Set<string>(body.mediaIDs.map((value: unknown) => String(value)).filter(Boolean))].slice(0, 100) : []
    let linked = 0
    let skipped = 0

    for (const mediaID of mediaIDs) {
      const media = await payload.findByID({ collection: 'media', id: mediaID, depth: 0, overrideAccess: true }).catch(() => null)
      if (!media) {
        skipped += 1
        continue
      }
      const currentProductID = media.product && typeof media.product === 'object' ? media.product.id : media.product
      if (currentProductID && String(currentProductID) !== String(product.id)) {
        skipped += 1
        continue
      }
      if (!currentProductID) {
        await payload.update({
          collection: 'media',
          id: media.id,
          data: { product: product.id },
          overrideAccess: true,
          context: { skipMediaMetadata: true },
        })
        linked += 1
      }
    }

    return NextResponse.json({ success: true, linked, skipped })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not link images to this product.' }, { status: 500 })
  }
}
