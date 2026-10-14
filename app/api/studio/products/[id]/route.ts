import config from '@payload-config'
import { getPayload } from 'payload'
import { mergeProductVariants } from '@/lib/merge-product-variants'
import { productPublishError } from '@/lib/product-validation'
import { resolveStudioProductMedia } from '@/lib/studio-product-media'

const error = (message: string, status = 400) => Response.json({ error: message }, { status })
const relationID = (value: any) => String(value && typeof value === 'object' ? value.id : value ?? '')
const lengths = ['x-short', 'short', 'medium', 'long', 'x-long']
const shapes = ['square', 'oval', 'almond', 'round']
const sizesAllowed = ['xs', 's', 'm', 'l']

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return error('Authentication required.', 401)
  try {
    const { id } = await context.params
    const product: any = await payload.findByID({ collection: 'products', id, depth: 1, overrideAccess: false, user })
    const variants = Array.isArray(product.variants) ? product.variants : []
    const active = variants.filter((variant: any) => variant.enabled !== false)
    const combinations = [...new Map(active.map((variant: any) => [`${variant.length}|${variant.shape}`, { length: variant.length, shape: variant.shape }])).values()]
    const sizes = [...new Set(active.map((variant: any) => String(variant.size || 's')))]
    const media = [product.featuredImage, ...(Array.isArray(product.gallery) ? product.gallery : []), ...variants.map((variant: any) => variant.image)]
      .filter((item: any) => item && typeof item === 'object')
    const resolvedMedia = await resolveStudioProductMedia(media, { r2PublicURL: process.env.R2_PUBLIC_URL, requestURL: request.url })
    return Response.json({
      id: product.id, updatedAt: product.updatedAt, title: product.title, category: product.category, price: product.price ?? '', status: product.status,
      supplierSKU: product.supplierSKU || '', purchaseURL: product.purchaseURL || '',
      descriptionMode: product.descriptionMode || 'auto', description: product.description || '', seoTitleMode: product.seoTitleMode || 'auto', seoTitle: product.seoTitle || '', seoDescriptionMode: product.seoDescriptionMode || 'auto', seoDescription: product.seoDescription || '',
      media: resolvedMedia.media.map((item) => ({ ...item, existing: true })), unavailableMediaCount: resolvedMedia.unavailableCount,
      combinations, sizes, variants: variants.map((variant: any) => ({ key: `${variant.length}|${variant.shape}|${variant.size}`, id: variant.id, sku: variant.sku, length: variant.length, shape: variant.shape, size: variant.size, stock: variant.stock ?? 10, enabled: variant.enabled !== false, price: variant.price ?? '', image: relationID(variant.image) || '', supplierSKU: variant.supplierSKU || '', purchaseURL: variant.purchaseURL || '' })),
    })
  } catch {
    return error('Product not found.', 404)
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return error('Authentication required.', 401)
  const { id } = await context.params
  let body: any
  try { body = await request.json() } catch { return error('Invalid request body.') }

  try {
    const original: any = await payload.findByID({ collection: 'products', id, depth: 0, overrideAccess: false, user })
    if (body.updatedAt !== original.updatedAt) return error('This product changed since you opened it. Reload it before saving to avoid overwriting newer inventory or edits.', 409)
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    if (!title) return error('Product name is required.')
    const price = body.price === '' || body.price == null ? undefined : Number(body.price)
    if (price !== undefined && (!Number.isFinite(price) || price < 0)) return error('Price must be a valid non-negative number.')
    const categories = ['press-on-nails', 'nail-care', 'accessories', 'mystery-box']
    if (!categories.includes(body.category)) return error('Choose a valid product category.')
    const purchaseURL = typeof body.purchaseURL === 'string' ? body.purchaseURL.trim() : ''
    if (purchaseURL) {
      try { if (!['http:', 'https:'].includes(new URL(purchaseURL).protocol)) throw new Error() }
      catch { return error('Purchase URL must be a valid HTTP or HTTPS URL.') }
    }

    const mediaIDs: string[] = Array.isArray(body.mediaIDs) ? [...new Set<string>(body.mediaIDs.map((value: unknown) => String(value)))] : []
    if (mediaIDs.length) {
      const found = await payload.find({ collection: 'media', where: { id: { in: mediaIDs } }, limit: 100, depth: 0, overrideAccess: true })
      if (found.docs.length !== mediaIDs.length || found.docs.some((media) => media.mimeType !== 'image/webp')) return error('All product images must be WebP files.')
    }
    const combinations = Array.isArray(body.combinations) ? body.combinations : []
    const sizes = Array.isArray(body.sizes) ? [...new Set(body.sizes.map(String))] : []
    if (combinations.some((item: any) => !lengths.includes(String(item.length)) || !shapes.includes(String(item.shape))) || sizes.some((size: string) => !sizesAllowed.includes(size))) return error('Choose valid length, shape, and size combinations.')

    const oldVariants = Array.isArray(original.variants) ? original.variants : []
    const rows = Array.isArray(body.variants) ? body.variants : []
    const selectedVariants: any[] = []
    const used = new Set<string>()
    for (const row of rows) {
      const key = `${row.length}|${row.shape}|${row.size}`
      if (!lengths.includes(String(row.length)) || !shapes.includes(String(row.shape)) || !sizesAllowed.includes(String(row.size)) || used.has(key)) return error('Invalid or duplicate variant combination.')
      used.add(key)
      if (!combinations.some((item: any) => `${item.length}|${item.shape}` === `${row.length}|${row.shape}`) || !sizes.includes(String(row.size))) return error('Variant rows must match selected combinations and sizes.')
      const stock = Number(row.stock)
      const variantPrice = row.price === '' || row.price == null ? null : Number(row.price)
      if (!Number.isSafeInteger(stock) || stock < 0 || (variantPrice !== null && (!Number.isFinite(variantPrice) || variantPrice < 0))) return error('Variant stock and price must be valid non-negative numbers.')
      const imageID = row.image ? String(row.image) : ''
      if (imageID && !mediaIDs.includes(imageID)) return error('Variant images must be selected from this product’s gallery.')
      const variantPurchaseURL = String(row.purchaseURL || '').trim()
      if (variantPurchaseURL) {
        try { if (!['http:', 'https:'].includes(new URL(variantPurchaseURL).protocol)) throw new Error() }
        catch { return error('Variant purchase URLs must be valid HTTP or HTTPS URLs.') }
      }
      selectedVariants.push({ length: row.length, shape: row.shape, size: row.size, stock, trackStock: true, enabled: row.enabled !== false, price: variantPrice, image: imageID ? Number(imageID) : null, supplierSKU: String(row.supplierSKU || '').trim(), purchaseURL: variantPurchaseURL })
    }
    if (rows.length !== combinations.length * sizes.length) return error('Variant rows must match selected combinations and sizes.')
    const variants = mergeProductVariants(oldVariants, selectedVariants)
    const action = body.action === 'publish' ? 'publish' : 'save'
    if (action === 'publish') {
      const message = productPublishError({ title, price, hasImage: mediaIDs.length > 0, variants })
      if (message) return error(message)
    }

    const updated = await payload.update({
      collection: 'products', id,
      data: {
        title, category: body.category, ...(price === undefined ? { price: null } : { price }),
        supplierSKU: String(body.supplierSKU || '').trim(), purchaseURL,
        descriptionMode: body.descriptionMode === 'custom' ? 'custom' : 'auto', ...(body.descriptionMode === 'custom' ? { description: String(body.description || '') } : {}),
        seoTitleMode: body.seoTitleMode === 'custom' ? 'custom' : 'auto', seoDescriptionMode: body.seoDescriptionMode === 'custom' ? 'custom' : 'auto',
        ...(body.seoTitleMode === 'custom' ? { seoTitle: String(body.seoTitle || '') } : {}), ...(body.seoDescriptionMode === 'custom' ? { seoDescription: String(body.seoDescription || '') } : {}),
        featuredImage: mediaIDs[0] ? Number(mediaIDs[0]) : null, gallery: mediaIDs.map(Number), variants,
        status: action === 'publish' ? 'published' : original.status,
      },
      overrideAccess: false, user,
    })
    const previouslyOwnedMedia = await payload.find({ collection: 'media', where: { product: { equals: String(id) } }, limit: 1000, depth: 0, overrideAccess: true })
    await Promise.all(previouslyOwnedMedia.docs.filter((media) => !mediaIDs.includes(String(media.id))).map((media) => payload.update({ collection: 'media', id: media.id, data: { product: null }, overrideAccess: true }).catch(() => undefined)))
    if (mediaIDs.length) await Promise.all(mediaIDs.map((mediaID) => payload.update({ collection: 'media', id: mediaID, data: { studioTemporary: false }, overrideAccess: true }).catch(() => undefined)))
    return Response.json({ id: updated.id, updatedAt: updated.updatedAt })
  } catch (cause) {
    if (cause instanceof Error && cause.message.includes('To publish')) return error(cause.message)
    return error(cause instanceof Error ? cause.message : 'Could not save product.', 500)
  }
}
