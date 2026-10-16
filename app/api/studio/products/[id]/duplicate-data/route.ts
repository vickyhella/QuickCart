import config from '@payload-config'
import { getPayload } from 'payload'

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
    const priceOverrides = Object.fromEntries(variants.filter((variant: any) => variant.price != null).map((variant: any) => [`${variant.length}|${variant.shape}|${variant.size}`, variant.price]))
    return Response.json({ category: product.category, price: product.price ?? '', compareAtPrice: product.compareAtPrice ?? '', combinations, sizes, priceOverrides })
  } catch {
    return Response.json({ error: 'Could not load product for duplication.' }, { status: 404 })
  }
}
