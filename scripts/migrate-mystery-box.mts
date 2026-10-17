import nextEnv from '@next/env'
import { readFile } from 'node:fs/promises'
import { getPayload } from 'payload'
import { prepareMediaUpload } from '../lib/prepare-media-upload'
import { uniqueOriginalFilename } from '../lib/media-filenames'

process.env.NODE_ENV = 'production'
process.env.QUICKCART_ENVIRONMENT = 'production'
nextEnv.loadEnvConfig(process.cwd())

const { default: config } = await import('../payload.config')
const payload = await getPayload({ config })
let originalID: string | number | undefined
let mediaID: string | number | undefined

try {
  const slug = 'press-on-nail-mystery-box'
  const existing = await payload.find({ collection: 'products', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  if (existing.docs.length) throw new Error(`Product slug ${slug} already exists; refusing to create a duplicate.`)
  const existingProducts = await payload.find({ collection: 'products', limit: 10000, pagination: false, depth: 0, overrideAccess: true })
  const highestProductCode = existingProducts.docs.reduce((highest, product) => {
    const code = String(product.sku || '')
    return /^\d{4}$/.test(code) ? Math.max(highest, Number(code)) : highest
  }, 0)
  const productSKU = String(highestProductCode + 1).padStart(4, '0')
  if (!/^\d{4}$/.test(productSKU) || existingProducts.docs.some((product) => String(product.sku || '') === productSKU)) {
    throw new Error(`Could not assign the next available product SKU after ${highestProductCode}.`)
  }

  const storedGlobal = await payload.findGlobal({ slug: 'product-dimensions', overrideAccess: true }) as Record<string, any>
  const dimensions = Array.isArray(storedGlobal.dimensions) ? storedGlobal.dimensions : []
  const quantity = dimensions.find((item: any) => item.key === 'quantity')
  if (!quantity) dimensions.push({ key: 'quantity', label: 'Quantity', valueType: 'integer', options: [] })
  else if (quantity.valueType !== 'integer') throw new Error('The existing Quantity dimension is not configured as integer.')
  const color = dimensions.find((item: any) => item.key === 'color')
  if (!color) dimensions.push({ key: 'color', label: 'Color', valueType: 'text', options: [{ value: 'nude', label: 'Nude' }] })
  else if (!color.options?.some((option: any) => option.value === 'nude')) color.options = [...(color.options || []), { value: 'nude', label: 'Nude' }]
  await payload.updateGlobal({ slug: 'product-dimensions', data: { dimensions } as never, overrideAccess: true })

  const source = await readFile(process.argv[2] || '/tmp/quickcart-mystery-box-source.png')
  const marketing: any = await payload.findGlobal({ slug: 'marketing-settings', overrideAccess: true })
  const originalName = '未命名的设计-scaled.png'
  const prepared = await prepareMediaUpload({ name: originalName, type: 'image/png', arrayBuffer: async () => source } as File, Number(marketing?.webpQuality || 82))
  const template = String(marketing?.imageFilenameTemplate || '{brand}-{productType}-{productName}-{length}-{shape}-{number}')
  const values = { brand: 'Ginny Nana', productType: 'mystery box', productName: 'Press-On Nail Mystery Box', length: '', shape: '', size: '' }
  const apply = (value: string) => value.replace(/\{(brand|productType|productName|length|shape|size|number)\}/g, (_, token: keyof typeof values | 'number') => token === 'number' ? '01' : values[token] || '').replace(/\s+/g, ' ').trim()
  const stem = apply(template).replace(/[^a-z0-9-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'ginny-nana-mystery-box'
  const extension = prepared.outputName.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() || '.webp'
  let filename = ''
  for (let sequence = 1; sequence < 10000; sequence += 1) {
    const candidateBase = template.includes('{number}')
      ? apply(template.replace('{number}', String(sequence).padStart(2, '0')))
      : `${apply(template)}-${String(sequence).padStart(2, '0')}`
    const candidate = `${candidateBase.replace(/[^a-z0-9-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() || stem}${extension}`
    const collision = await payload.find({ collection: 'media', where: { filename: { equals: candidate } }, limit: 1, depth: 0, overrideAccess: true })
    if (!collision.docs.length) { filename = candidate; break }
  }
  if (!filename) throw new Error('Could not generate a unique new-site media filename.')

  const originalFilename = await uniqueOriginalFilename(payload, filename, originalName)
  const original = await payload.create({
    collection: 'media-originals', data: { title: `Original source: ${filename}` },
    file: { data: prepared.original, mimetype: prepared.originalMimeType, name: originalFilename, size: prepared.original.length },
    overrideAccess: true,
  })
  originalID = original.id
  const media = await payload.create({
    collection: 'media',
    data: { sourceOriginal: original.id, title: 'Ginny Nana Press-On Nail Mystery Box', altText: 'Ginny Nana Press-On Nail Mystery Box product photo', caption: 'Press-On Nail Mystery Box' },
    file: { data: prepared.output, mimetype: prepared.outputMimeType, name: filename, size: prepared.output.length },
    overrideAccess: true,
    context: { skipMediaMetadata: true },
  })
  mediaID = media.id

  const sizes = ['xs', 's', 'm', 'l'] as const
  const product = await payload.create({
    collection: 'products',
    data: {
      title: 'Press-On Nail Mystery Box', slug, sku: productSKU, category: 'mystery-box',
      descriptionMode: 'auto', seoTitleMode: 'auto', seoDescriptionMode: 'auto',
      price: 13.9, compareAtPrice: 17.9, color: 'Nude', shippingWeight: 0.2,
      featuredImage: media.id, gallery: [media.id], brand: 'Ginny Nana', status: 'draft',
      suppliers: [], supplierSKU: '', purchaseURL: '',
      variants: sizes.map((size) => ({
        length: '', shape: '', size, price: 13.9, compareAtPrice: 17.9, stock: 10,
        trackStock: true, enabled: true, image: media.id, attributes: { color: 'nude' },
      })),
    } as never,
    overrideAccess: true,
  })
  await payload.update({ collection: 'media', id: media.id, data: { product: product.id }, overrideAccess: true })
  console.log(JSON.stringify({ productId: product.id, title: product.title, slug: product.slug, sku: product.sku, status: product.status, mediaId: media.id, mediaFilename: media.filename, variants: sizes.length, missing: ['Chinese name (not present in product CSV)', 'Supplier (no matching supplier in supplier map)', 'Product purchase URL (blank in source CSV)', 'Quantity values/options (not present on published source 5439)'] }, null, 2))
} catch (error) {
  if (mediaID !== undefined) await payload.delete({ collection: 'media', id: mediaID, overrideAccess: true }).catch(() => undefined)
  if (originalID !== undefined) await payload.delete({ collection: 'media-originals', id: originalID, overrideAccess: true }).catch(() => undefined)
  throw error
} finally {
  await payload.destroy()
}
