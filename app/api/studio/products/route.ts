import { isAdminUser } from '@/lib/admin-access'
import config from '@payload-config'
import { getPayload } from 'payload'
import { productPublishError } from '@/lib/product-validation'
import { resolveProductSeoTemplates } from '@/lib/product-seo-templates'
import { DEFAULT_STUDIO_DESCRIPTION_TEMPLATE } from '@/lib/studio-description-template'
import { toEditorPriceFields, toStoredPriceFields } from '@/lib/product-pricing'
import { validateProductVariantAttributes } from '@/lib/product-variant-attributes'
import { withoutProductColorVariantAttribute } from '@/lib/product-color'

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!isAdminUser(user)) return jsonError('Authentication required.', 401)

  const params = new URL(request.url).searchParams
  const page = Math.max(1, Number(params.get('page')) || 1)
  const requestedLimit = Number(params.get('limit'))
  const limit = [10, 25, 50, 100].includes(requestedLimit) ? requestedLimit : 10
  const search = params.get('search')?.trim()
  const status = params.get('status')
  const requestedSort = params.get('sort')
  const sort = ['title', '-title', 'price', '-price', 'updatedAt', '-updatedAt', 'createdAt', '-createdAt'].includes(requestedSort || '') ? requestedSort! : '-updatedAt'
  const filters: Record<string, unknown>[] = []

  if (status === 'draft' || status === 'published') filters.push({ status: { equals: status } })
  if (search) filters.push({ or: [{ title: { like: search } }, { sku: { like: search } }] })

  const result = await payload.find({
    collection: 'products',
    where: filters.length ? { and: filters } : undefined,
    page,
    limit,
    sort,
    depth: 1,
    overrideAccess: false,
    user,
  })
  const allProducts = await payload.count({ collection: 'products', overrideAccess: false, user })
  const marketing = await payload.findGlobal({ slug: 'marketing-settings', overrideAccess: false, user }).catch(() => null)
  const seoTemplates = resolveProductSeoTemplates(marketing)

  return Response.json({
    docs: result.docs.map((product) => {
      const image = typeof product.featuredImage === 'object' ? product.featuredImage : null
      return {
        id: product.id,
        title: product.title,
        slug: product.slug,
        sku: product.sku,
        ...toEditorPriceFields(product),
        status: product.status,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        variantCount: product.variants?.length || 0,
        image: image?.url || null,
      }
    }),
    page: result.page,
    totalPages: result.totalPages,
    totalDocs: result.totalDocs,
    totalProducts: allProducts.totalDocs,
    templates: {
      description: typeof marketing?.studioDescriptionTemplate === 'string' && marketing.studioDescriptionTemplate.trim() ? marketing.studioDescriptionTemplate : DEFAULT_STUDIO_DESCRIPTION_TEMPLATE,
      seoTitle: seoTemplates.title,
      seoDescription: seoTemplates.description,
    },
  })
}

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!isAdminUser(user)) return jsonError('Authentication required.', 401)

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return jsonError('Invalid request body.', 400)
  }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) return jsonError('Product name is required to save a draft.', 400)

  let price: number | undefined
  if (body.price !== undefined && body.price !== null && body.price !== '') {
    price = Number(body.price)
    if (!Number.isFinite(price) || price < 0) return jsonError('Price must be a valid non-negative number.', 400)
  }
  let salePrice: number | undefined
  if (body.salePrice !== undefined && body.salePrice !== null && body.salePrice !== '') {
    salePrice = Number(body.salePrice)
    if (!Number.isFinite(salePrice) || salePrice < 0 || price === undefined || salePrice >= price) return jsonError('Sale price must be a valid amount lower than Price.', 400)
  }

  const category = typeof body.category === 'string' ? body.category : 'press-on-nails'
  const categories = ['press-on-nails', 'nail-care', 'accessories', 'mystery-box'] as const
  if (!categories.some((value) => value === category)) return jsonError('Choose a valid product category.', 400)
  const validCategory = category as typeof categories[number]

  const descriptionMode = body.descriptionMode === 'custom' ? 'custom' : 'auto'
  const seoTitleMode = body.seoTitleMode === 'custom' ? 'custom' : 'auto'
  const seoDescriptionMode = body.seoDescriptionMode === 'custom' ? 'custom' : 'auto'
  const purchaseURL = typeof body.purchaseURL === 'string' ? body.purchaseURL.trim() : ''
  if (purchaseURL) {
    try { if (!['http:', 'https:'].includes(new URL(purchaseURL).protocol)) throw new Error() }
    catch { return jsonError('Purchase URL must be a valid HTTP or HTTPS URL.', 400) }
  }

  const mediaIDs = Array.isArray(body.mediaIDs) ? [...new Set(body.mediaIDs.map(String))] : []
  const combinations = Array.isArray(body.combinations) ? body.combinations as { length?: string; shape?: string }[] : []
  const sizes = Array.isArray(body.sizes) ? [...new Set(body.sizes.map(String))] : []
  const allowedLengths = ['x-short', 'short', 'medium', 'long', 'x-long']
  const allowedShapes = ['square', 'oval', 'almond', 'round']
  const allowedSizes = ['xs', 's', 'm', 'l']
  const variants = Array.isArray(body.variants) ? body.variants as Record<string, unknown>[] : []
  const productDimensions: any = await payload.findGlobal({ slug: 'product-dimensions', overrideAccess: false, user }).catch(() => null)
  const supplierIDs: number[] = Array.isArray(body.suppliers) ? [...new Set(body.suppliers.map(Number))] : []
  const allSupplierIDs: number[] = [...new Set([...supplierIDs, ...variants.flatMap((item) => Array.isArray(item.suppliers) ? item.suppliers.map(Number) : [])])]
  const supplierDocs = allSupplierIDs.length ? await payload.find({ collection: 'suppliers', where: { id: { in: allSupplierIDs } }, limit: allSupplierIDs.length, depth: 0, overrideAccess: true }) : { docs: [] }
  if (supplierDocs.docs.length !== allSupplierIDs.length) return jsonError('Choose valid suppliers.', 400)
  if (mediaIDs.length) {
    const found = await payload.find({ collection: 'media', where: { id: { in: mediaIDs } }, limit: 100, depth: 0, overrideAccess: true })
    if (found.docs.length !== mediaIDs.length || found.docs.some((media) => media.mimeType !== 'image/webp')) return jsonError('All product images must be uploaded WebP files.', 400)
  }
  if (combinations.some((item) => validCategory === 'mystery-box' ? Boolean(item.length || item.shape) : !allowedLengths.includes(String(item.length)) || !allowedShapes.includes(String(item.shape)))) return jsonError('Choose valid length and shape combinations.', 400)
  if (sizes.some((size) => !allowedSizes.includes(size))) return jsonError('Choose valid sizes.', 400)
  const keys = new Set<string>()
  let safeVariants: { length: string; shape: string; size: 'xs' | 's' | 'm' | 'l'; attributes: Record<string, string | number>; stock: number; trackStock: true; enabled: boolean; price?: number; salePrice?: number; image?: number; supplierSKU?: string; suppliers?: number[]; purchaseURL?: string }[]
  try { safeVariants = variants.map((item) => {
    const length = String(item.length || '')
    const shape = String(item.shape || '')
    const size = String(item.size || '')
    const key = `${length}|${shape}|${size}`
    if ((validCategory === 'mystery-box' ? Boolean(length || shape) : !allowedLengths.includes(length) || !allowedShapes.includes(shape)) || !allowedSizes.includes(size) || keys.has(key)) throw new Error('Invalid or duplicate variant combination.')
    keys.add(key)
    const stock = item.stock === undefined || item.stock === '' ? 10 : Number(item.stock)
    const variantPrice = item.price == null || item.price === '' ? undefined : Number(item.price)
    const variantSalePrice = item.salePrice == null || item.salePrice === '' ? undefined : Number(item.salePrice)
    if (!Number.isSafeInteger(stock) || stock < 0 || (variantPrice !== undefined && (!Number.isFinite(variantPrice) || variantPrice < 0)) || (variantSalePrice !== undefined && (!Number.isFinite(variantSalePrice) || variantSalePrice < 0 || (variantPrice ?? price) === undefined || variantSalePrice >= (variantPrice ?? price ?? 0)))) throw new Error('Variant prices and stock must be valid; Sale price must be lower than Price.')
    const image = item.image ? String(item.image) : null
    if (image && !mediaIDs.includes(image)) throw new Error('A variant image must be one of this product’s uploaded images.')
    const variantPurchaseURL = String(item.purchaseURL || '').trim()
    if (variantPurchaseURL) {
      try { if (!['http:', 'https:'].includes(new URL(variantPurchaseURL).protocol)) throw new Error() }
      catch { throw new Error('Variant purchase URLs must be valid HTTP or HTTPS URLs.') }
    }
    const rowSuppliers = Array.isArray(item.suppliers) ? [...new Set(item.suppliers.map(Number))] : []
    const attributes = validateProductVariantAttributes(withoutProductColorVariantAttribute(item.attributes), productDimensions?.dimensions)
    return { length, shape, size: size as 'xs' | 's' | 'm' | 'l', attributes, stock, trackStock: true, enabled: item.enabled !== false, ...(variantPrice === undefined ? {} : { price: variantPrice }), ...(variantSalePrice === undefined ? {} : { salePrice: variantSalePrice }), ...(image ? { image: Number(image) } : {}), ...(item.supplierSKU ? { supplierSKU: String(item.supplierSKU).trim() } : {}), suppliers: rowSuppliers, purchaseURL: variantPurchaseURL }
  }) } catch (error) { return jsonError(error instanceof Error ? error.message : 'Invalid variants.', 400) }
  if (safeVariants.length !== combinations.length * sizes.length || safeVariants.some((item) => !combinations.some((combo) => combo.length === item.length && combo.shape === item.shape) || !sizes.includes(item.size))) return jsonError('Variant rows must match the selected combinations and sizes.', 400)
  const action = body.action === 'publish' ? 'publish' : 'draft'
  const requestID = typeof body.requestID === 'string' ? body.requestID.trim() : ''
  if (requestID && !/^[0-9a-f-]{36}$/i.test(requestID)) return jsonError('Invalid save request identifier.', 400)
  if (action === 'publish') {
    const message = productPublishError({ title, category: validCategory, price, salePrice, hasImage: mediaIDs.length > 0, variants: safeVariants })
    if (message) return jsonError(message, 400)
  }

  if (requestID) {
    const previous = await payload.find({ collection: 'products', where: { studioRequestID: { equals: requestID } }, limit: 1, depth: 0, overrideAccess: true })
    if (previous.docs[0]) return Response.json({ id: previous.docs[0].id, existing: true }, { status: 200 })
  }

  const storedPricing = toStoredPriceFields({ price, salePrice })
  const storedVariants = safeVariants.map(({ price: variantPrice, salePrice: variantSalePrice, ...variant }) => ({
    ...variant,
    ...toStoredPriceFields({ price: variantPrice, salePrice: variantSalePrice }, undefined, storedPricing),
  }))
  let result: Awaited<ReturnType<typeof payload.create>>
  try { result = await payload.create({
    collection: 'products',
    data: {
      title,
      chineseName: String(body.chineseName || '').trim(),
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'product',
      category: validCategory,
      color: String(body.color || '').trim(),
      ...storedPricing,
      descriptionMode,
      ...(descriptionMode === 'custom' ? { description: String(body.description || '') } : {}),
      seoTitleMode,
      seoDescriptionMode,
      ...(seoTitleMode === 'custom' ? { seoTitle: String(body.seoTitle || '') } : {}),
      ...(seoDescriptionMode === 'custom' ? { seoDescription: String(body.seoDescription || '') } : {}),
      ...(mediaIDs.length ? { featuredImage: Number(mediaIDs[0]), gallery: mediaIDs.map(Number) } : {}),
      ...(storedVariants.length ? { variants: storedVariants } : {}),
      supplierSKU: typeof body.supplierSKU === 'string' ? body.supplierSKU.trim() : '',
      suppliers: supplierIDs,
      purchaseURL,
      ...(requestID ? { studioRequestID: requestID } : {}),
      status: action === 'publish' ? 'published' : 'draft',
      brand: 'Ginny Nana',
    },
    overrideAccess: false,
    user,
  }) } catch (cause) {
    if (requestID) {
      const previous = await payload.find({ collection: 'products', where: { studioRequestID: { equals: requestID } }, limit: 1, depth: 0, overrideAccess: true }).catch(() => null)
      if (previous?.docs[0]) return Response.json({ id: previous.docs[0].id, existing: true }, { status: 200 })
    }
    throw cause
  }

  if (mediaIDs.length) await Promise.all(mediaIDs.map((id) => payload.update({ collection: 'media', id, data: { studioTemporary: false }, overrideAccess: true }).catch(() => undefined)))

  return Response.json({ id: result.id }, { status: 201 })
}
