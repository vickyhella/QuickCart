import config from '@payload-config'
import { getPayload } from 'payload'
import { toEditorPriceFields } from '@/lib/product-pricing'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ error: 'Authentication required.' }, { status: 401 })
  const { id } = await context.params
  try {
    const product: any = await payload.findByID({ collection: 'products', id, depth: 0, overrideAccess: false, user })
    const variants = Array.isArray(product.variants) ? product.variants.filter((variant: any) => variant.enabled !== false) : []
    const combinations = [...new Map(variants.map((variant: any) => [`${variant.length}|${variant.shape}`, { length: variant.length, shape: variant.shape }])).values()]
    const sizes = [...new Set(variants.map((variant: any) => String(variant.size || 's')))]
    const mapped = variants.map((variant: any) => ({ key: `${variant.length}|${variant.shape}|${variant.size}`, ...toEditorPriceFields(variant, product) }))
    const priceOverrides = Object.fromEntries(mapped.filter((variant: any) => variant.price != null).map((variant: any) => [variant.key, variant.price]))
    const salePriceOverrides = Object.fromEntries(mapped.filter((variant: any) => variant.salePrice != null).map((variant: any) => [variant.key, variant.salePrice]))
    const pricing = toEditorPriceFields(product)
    return Response.json({ category: product.category, price: pricing.price ?? '', salePrice: pricing.salePrice ?? '', combinations, sizes, priceOverrides, salePriceOverrides })
  } catch {
    return Response.json({ error: 'Could not load product for duplication.' }, { status: 404 })
  }
}
