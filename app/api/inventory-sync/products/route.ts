import { timingSafeEqual } from 'node:crypto'
import config from '@payload-config'
import { getPayload } from 'payload'
import { storedProductPublishError } from '@/lib/product-validation'
import { getEnvironmentVariable } from '@/lib/environment-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function authorized(request: Request) {
  const expected = getEnvironmentVariable('QUICKCART_INVENTORY_SYNC_TOKEN') || ''
  if (Buffer.byteLength(expected) < 32) return false
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || ''
  const expectedBytes = Buffer.from(expected)
  const suppliedBytes = Buffer.from(supplied)
  return Boolean(expected) && expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes)
}

function error(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

export async function GET(request: Request) {
  if (!authorized(request)) return error('Authentication required.', 401)
  const payload = await getPayload({ config })
  const params = new URL(request.url).searchParams
  const page = Math.max(1, Number(params.get('page')) || 1)
  const result = await payload.find({ collection: 'products', page, limit: 100, depth: 0, overrideAccess: true })
  return Response.json({
    docs: result.docs.map((product: any) => ({
      id: String(product.id), sku: String(product.sku || ''), title: String(product.title || ''),
      status: product.status, updatedAt: product.updatedAt,
      variants: (Array.isArray(product.variants) ? product.variants : []).map((variant: any) => ({
        id: String(variant.id || ''), sku: String(variant.sku || ''), length: String(variant.length || ''),
        shape: String(variant.shape || ''), size: String(variant.size || ''), enabled: variant.enabled !== false,
      })),
    })),
    page: result.page, totalPages: result.totalPages, totalDocs: result.totalDocs,
  })
}

export async function PATCH(request: Request) {
  if (!authorized(request)) return error('Authentication required.', 401)
  const payload = await getPayload({ config })
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return error('Invalid request body.', 400)
  const productID = typeof body.productID === 'string' ? body.productID : ''
  if (!productID || typeof body.updatedAt !== 'string') return error('Product ID and preview version are required.', 400)

  const original: any = await payload.findByID({ collection: 'products', id: productID, depth: 0, overrideAccess: true }).catch(() => null)
  if (!original) return error('Product not found.', 404)
  if (original.updatedAt !== body.updatedAt) return error('The product changed since preview. Refresh before applying.', 409)

  if (body.action === 'draft') {
    const updated = await payload.update({ collection: 'products', id: productID, data: { status: 'draft' }, depth: 0, overrideAccess: true })
    return Response.json({ productID: String(updated.id), updatedAt: updated.updatedAt, status: updated.status })
  }

  if (body.action === 'publish') {
    const hasImage = Boolean(original.featuredImage || (Array.isArray(original.gallery) && original.gallery.length))
    const message = storedProductPublishError({ ...original, hasImage })
    if (message) return error(message, 400)
    const updated = await payload.update({ collection: 'products', id: productID, data: { status: 'published' }, depth: 0, overrideAccess: true })
    return Response.json({ productID: String(updated.id), updatedAt: updated.updatedAt, status: updated.status })
  }

  if (body.action === 'variant-enabled') {
    const variantID = typeof body.variantID === 'string' ? body.variantID : ''
    if (!variantID || typeof body.enabled !== 'boolean' || !Array.isArray(original.variants)) {
      return error('Variant ID and enabled state are required.', 400)
    }
    const index = original.variants.findIndex((variant: any) => String(variant.id) === variantID)
    if (index < 0) return error('Variant not found.', 404)
    const variants = original.variants.map((variant: any, current: number) => current === index
      ? { ...variant, enabled: body.enabled }
      : variant)
    const updated = await payload.update({ collection: 'products', id: productID, data: { variants }, depth: 0, overrideAccess: true })
    return Response.json({ productID: String(updated.id), updatedAt: updated.updatedAt, variants: updated.variants })
  }

  return error('Unsupported action.', 400)
}
