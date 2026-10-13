import config from '@payload-config'
import { getPayload } from 'payload'
import { productPublishError } from '@/lib/product-validation'

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ error: 'Authentication required.' }, { status: 401 })
  let body: any
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid request body.' }, { status: 400 }) }
  const items = Array.isArray(body.items) ? body.items : []
  const price = body.price === undefined || body.price === '' ? undefined : Number(body.price)
  const stock = body.stock === undefined || body.stock === '' ? undefined : Number(body.stock)
  const status = body.status === 'draft' || body.status === 'published' ? body.status : undefined
  if (body.status !== undefined && !status) return Response.json({ error: 'Choose Draft or Published.' }, { status: 400 })
  if (!items.length) return Response.json({ error: 'Select at least one product.' }, { status: 400 })
  if (price === undefined && stock === undefined && status === undefined) return Response.json({ error: 'Choose at least one change.' }, { status: 400 })
  if (price !== undefined && (!Number.isFinite(price) || price < 0)) return Response.json({ error: 'Price must be a valid non-negative number.' }, { status: 400 })
  if (stock !== undefined && (!Number.isSafeInteger(stock) || stock < 0)) return Response.json({ error: 'Stock must be a non-negative whole number.' }, { status: 400 })

  let updated = 0
  const failed: { id: string; title: string; error: string }[] = []
  for (const item of items) {
    let product: any
    try {
      product = await payload.findByID({ collection: 'products', id: String(item.id), depth: 1, overrideAccess: false, user })
      if (item.updatedAt !== product.updatedAt) throw new Error('Product changed since the list loaded. Refresh and try again.')
      const variants = (product.variants || []).map((variant: any) => stock === undefined || variant.enabled === false ? variant : { ...variant, stock })
      if (status === 'published') {
        const hasImage = Boolean(product.featuredImage || product.gallery?.length)
        const message = productPublishError({ title: product.title, price: price ?? product.price, hasImage, variants })
        if (message) throw new Error(message)
      }
      await payload.update({
        collection: 'products', id: product.id,
        data: { ...(price === undefined ? {} : { price }), ...(stock === undefined ? {} : { variants }), ...(status ? { status } : {}) },
        overrideAccess: false, user,
      })
      updated += 1
    } catch (cause) {
      failed.push({ id: String(item.id), title: product?.title || String(item.id), error: cause instanceof Error ? cause.message : 'Could not update product.' })
    }
  }
  return Response.json({ updated, failed })
}
