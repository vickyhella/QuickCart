import type { CollectionConfig } from 'payload'
import { hideSupplierDetails } from '@/lib/product-privacy'
import { productPublishError } from '@/lib/product-validation'
import { DEFAULT_STUDIO_DESCRIPTION_TEMPLATE, renderStudioDescription } from '@/lib/studio-description-template'

const lengthCodeMap: Record<string, string> = { 'x-short': '01', short: '02', medium: '03', long: '04', 'x-long': '05' }
const shapeCodeMap: Record<string, string> = { square: '01', oval: '02', almond: '03', round: '04' }
const sizeCodeMap: Record<string, string> = { xs: '01', s: '02', m: '03', l: '04' }

function dimensionCode(value: string, presets: Record<string, string>, values: string[]) {
  if (presets[value]) return presets[value]
  const customValues = [...new Set(values.filter((entry) => !presets[entry]))].sort()
  return String(50 + Math.max(0, customValues.indexOf(value))).padStart(2, '0')
}

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const lengthOrder = ['x-short', 'short', 'medium', 'long', 'x-long']
const shapeOrder = ['square', 'oval', 'almond', 'round']

function summarizeDimension(values: unknown[], order: string[]) {
  const unique = [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))]
  unique.sort((a, b) => {
    const left = order.indexOf(a)
    const right = order.indexOf(b)
    return (left < 0 ? 100 : left) - (right < 0 ? 100 : right) || a.localeCompare(b)
  })
  return unique.join(', ')
}

function relationID(value: any): string {
  return String(value && typeof value === 'object' ? value.id : value ?? '')
}

function webpPickerFilter(values: unknown[]) {
  const existingIDs = [...new Set(values.flatMap((value) => {
    if (Array.isArray(value)) return value.map(relationID).filter(Boolean)
    const id = relationID(value)
    return id ? [id] : []
  }))]
  return existingIDs.length
    ? { or: [{ mimeType: { equals: 'image/webp' } }, { id: { in: existingIDs } }] }
    : { mimeType: { equals: 'image/webp' } }
}

async function nextProductCode(req: any) {
  const result = await req.payload.find({ collection: 'products', limit: 10000, pagination: false, depth: 0, overrideAccess: true })
  const highest = result.docs.reduce((max, product) => {
    const code = String(product.sku || '')
    return /^\d{4}$/.test(code) ? Math.max(max, Number(code)) : max
  }, 0)
  return String(highest + 1).padStart(4, '0')
}

export const Products: CollectionConfig = {
  slug: 'products',
  hooks: {
    afterRead: [({ doc, req }) => {
      if (!req.user && doc) return hideSupplierDetails(doc as any)
      return doc
    }],
    beforeValidate: [async ({ data, originalDoc, req }) => {
      if (!data) return data
      const marketing = await req.payload.findGlobal({ slug: 'marketing-settings', overrideAccess: true }).catch(() => null)
      const fillTemplate = (template: string, values: Record<string, string>) => template.replace(/\{(brand|productType|productName|length|shape|size|availableLengthShapeCombinations|availableSizes)\}/g, (_, token) => values[token] || '').replace(/\s+/g, ' ').trim()
      const title = String(data.title ?? originalDoc?.title ?? '')
      const descriptionMode = data.descriptionMode ?? (originalDoc && data.description !== undefined && data.description !== originalDoc.description
        ? 'custom'
        : originalDoc?.descriptionMode ?? (originalDoc?.description ? 'custom' : 'auto'))
      const seoTitleMode = data.seoTitleMode ?? (originalDoc && data.seoTitle !== undefined && data.seoTitle !== originalDoc.seoTitle
        ? 'custom'
        : originalDoc?.seoTitleMode ?? (originalDoc?.seoTitle ? 'custom' : 'auto'))
      const seoDescriptionMode = data.seoDescriptionMode ?? (originalDoc && data.seoDescription !== undefined && data.seoDescription !== originalDoc.seoDescription
        ? 'custom'
        : originalDoc?.seoDescriptionMode ?? (originalDoc?.seoDescription ? 'custom' : 'auto'))
      const oldGeneratedSlug = originalDoc ? slugify(String(originalDoc.title || '')) : ''
      if (title && (!data.slug || !originalDoc || data.slug === oldGeneratedSlug)) {
        const baseSlug = slugify(title) || 'product'
        let candidate = baseSlug
        let suffix = 2
        while (candidate) {
          const collision = await req.payload.find({
            collection: 'products',
            where: { slug: { equals: candidate } },
            limit: 1,
            depth: 0,
            overrideAccess: true,
          })
          const owner = collision.docs[0]
          if (!owner || String(owner.id) === String(originalDoc?.id ?? '')) break
          candidate = `${baseSlug}-${suffix++}`
        }
        data.slug = candidate
      }
      if (!data.category) data.category = 'press-on-nails'
      const activeDimensions = (Array.isArray(data.variants) ? data.variants : originalDoc?.variants || []).filter((variant: any) => variant.enabled !== false)
      const dimensions = {
        length: summarizeDimension(activeDimensions.map((variant: any) => variant.length), lengthOrder),
        shape: summarizeDimension(activeDimensions.map((variant: any) => variant.shape), shapeOrder),
        availableLengthShapeCombinations: [...new Set(activeDimensions.map((variant: any) => `${variant.length} ${variant.shape}`))].join(', '),
        availableSizes: [...new Set(activeDimensions.map((variant: any) => String(variant.size || '').toUpperCase()).filter(Boolean))].join(', '),
      }
      const templateValues = {
        brand: String(data.brand ?? originalDoc?.brand ?? 'Ginny Nana'),
        productType: String(data.category || originalDoc?.category || 'press-on-nails').replaceAll('-', ' '),
        productName: title,
        ...dimensions,
        size: dimensions.availableSizes,
      }
      if (descriptionMode === 'auto' && title) {
        data.description = renderStudioDescription(String(marketing?.studioDescriptionTemplate || DEFAULT_STUDIO_DESCRIPTION_TEMPLATE), templateValues)
      }
      if (seoTitleMode === 'auto') data.seoTitle = fillTemplate(String(marketing?.productTitleTemplate || '{brand} {productType} {productName} {availableLengthShapeCombinations}'), templateValues)
      if (seoDescriptionMode === 'auto') data.seoDescription = fillTemplate(String(marketing?.productDescriptionTemplate || '{productName} press-on nails by {brand}.'), templateValues)
      data.descriptionMode = descriptionMode
      data.seoTitleMode = seoTitleMode
      data.seoDescriptionMode = seoDescriptionMode
      if (!originalDoc) {
        if (!/^\d{4}$/.test(String(data.sku || ''))) data.sku = await nextProductCode(req)
      } else if (!data.sku) data.sku = originalDoc.sku || await nextProductCode(req)
      const productCode = /^\d{4}$/.test(String(data.sku)) ? String(data.sku) : String(originalDoc?.id || 0).padStart(4, '0').slice(-4)
      if (Array.isArray(data.variants)) {
        const lengths = data.variants.map((variant) => String(variant.length || ''))
        const shapes = data.variants.map((variant) => String(variant.shape || ''))
        data.variants = data.variants.map((variant) => ({
          ...variant,
          sku: variant.sku || `${productCode}-${dimensionCode(String(variant.length || ''), lengthCodeMap, lengths)}-${dimensionCode(String(variant.shape || ''), shapeCodeMap, shapes)}-${sizeCodeMap[String(variant.size || 's')] || '02'}`,
          ...(variant.price === undefined ? {} : { price: variant.price ?? null }),
          ...(variant.compareAtPrice === undefined ? {} : { compareAtPrice: variant.compareAtPrice ?? null }),
          stock: variant.stock ?? 10,
          ...(variant.image === undefined ? {} : { image: variant.image || null }),
        }))
      }
      data.length = dimensions.length
      data.shape = dimensions.shape
      const product = { ...originalDoc, ...data }
      if (product.status === 'published') {
        const hasImage = Boolean(relationID(product.featuredImage) || (Array.isArray(product.gallery) && product.gallery.some((image) => relationID(image))))
        const message = productPublishError({ title: product.title, price: product.price, hasImage, variants: product.variants })
        if (message) throw new Error(message)
      }
      return data
    }],
  },
  access: {
    read: ({ req }) =>
      req.user ? true : { status: { equals: 'published' } },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    // Product deletion is available only through the guarded admin control/API.
    delete: () => false,
  },
  admin: {
    group: 'Catalog',
    useAsTitle: 'title',
    defaultColumns: ['featuredImage', 'title', 'sku', 'price', 'status', 'updatedAt'],
    description: 'Manage press-on nail designs, images, prices, and publishing status.',
    components: {
      beforeList: ['/components/ProductBulkEditor#ProductBulkEditLink'],
      edit: { beforeDocumentControls: ['/components/ProductDeleteControl#ProductDeleteControl'] },
      views: {
        studio: {
          Component: '/components/ProductStudioView#ProductStudioView',
          path: '/studio',
          exact: true,
        },
        spreadsheet: {
          Component: '/components/ProductSpreadsheetView#ProductSpreadsheetView',
          path: '/spreadsheet',
          exact: true,
        },
      },
    },
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Product',
          fields: [
            { name: 'title', type: 'text', required: true, admin: { components: { Cell: '/components/ProductTitleCell#ProductTitleCell' } } },
            { name: 'slug', type: 'text', required: true, unique: true, index: true, admin: { components: { Field: '/components/ProductSlugField#ProductSlugField' } } },
            { name: 'description', type: 'textarea', admin: { rows: 8, description: 'Markdown supported, including images via ![alt](https://...). Raw HTML is not enabled.' } },
            { name: 'descriptionMode', type: 'select', defaultValue: 'auto', options: [{ label: 'Auto', value: 'auto' }, { label: 'Custom', value: 'custom' }], admin: { hidden: true } },
            { name: 'price', type: 'number', min: 0 },
            { name: 'compareAtPrice', type: 'number', min: 0, admin: { description: 'Optional original price, shown crossed out.' } },
            { name: 'category', type: 'select', required: true, defaultValue: 'press-on-nails', options: [
              { label: 'Press-on Nails', value: 'press-on-nails' },
              { label: 'Nail Care', value: 'nail-care' },
              { label: 'Accessories', value: 'accessories' },
              { label: 'Mystery Box', value: 'mystery-box' },
            ] },
            { name: 'length', type: 'text', admin: { readOnly: true, description: 'Automatically follows the variant lengths (comma separated when multiple).' } },
            { name: 'shape', type: 'text', admin: { readOnly: true, description: 'Automatically follows the variant shapes (comma separated when multiple).' } },
            { name: 'sku', type: 'text', admin: { position: 'sidebar' } },
            { name: 'supplierSKU', type: 'text', admin: { position: 'sidebar', description: 'Internal supplier reference. Hidden from customers and feeds.' } },
            { name: 'purchaseURL', type: 'text', admin: { position: 'sidebar', description: 'Internal supplier purchasing URL. Hidden from customers and feeds.' } },
            { name: 'studioRequestID', type: 'text', unique: true, admin: { hidden: true } },
          ],
        },
        {
          label: 'Variants',
          fields: [{
      name: 'variants',
      type: 'array',
      labels: { singular: 'Variant', plural: 'Variants' },
      admin: {
        description: 'Create one row for each shape, length, and size combination. Leave variant prices blank to use the product price.',
        components: { Field: '/components/ProductVariantsSpreadsheetField#ProductVariantsSpreadsheetField' },
      },
      fields: [
        { name: 'sku', type: 'text', index: true },
        { name: 'length', type: 'text', required: true },
        { name: 'shape', type: 'text', required: true },
        { name: 'size', type: 'select', defaultValue: 's', options: [
          { label: 'XS', value: 'xs' }, { label: 'S', value: 's' }, { label: 'M', value: 'm' }, { label: 'L', value: 'l' },
        ] },
        { name: 'price', type: 'number', min: 0 },
        { name: 'compareAtPrice', type: 'number', min: 0 },
        { name: 'gtin', type: 'text', admin: { hidden: true } },
        { name: 'mpn', type: 'text', admin: { hidden: true } },
        { name: 'supplierSKU', type: 'text', admin: { description: 'Internal supplier reference; never exposed publicly.' } },
        { name: 'purchaseURL', type: 'text', admin: { description: 'Internal purchasing URL; never exposed publicly.' } },
        { name: 'image', type: 'upload', relationTo: 'media', filterOptions: ({ siblingData }) => webpPickerFilter([(siblingData as Record<string, unknown> | undefined)?.image]), admin: { description: 'Optional WebP image for this exact variant. Falls back to the product image.' } },
        { name: 'stock', type: 'number', min: 0, defaultValue: 10 },
        { name: 'trackStock', type: 'checkbox', defaultValue: true },
        { name: 'enabled', type: 'checkbox', defaultValue: true },
      ],
          }],
        },
        {
          label: 'Media & SEO',
          fields: [
            { name: 'featuredImage', type: 'upload', relationTo: 'media', filterOptions: ({ data }) => webpPickerFilter([(data as Record<string, unknown> | undefined)?.featuredImage]), admin: { components: { Field: '/components/ProductMediaField#ProductMediaField', Cell: '/components/ProductThumbnailCell#ProductThumbnailCell' } } },
            { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true, filterOptions: ({ data }) => webpPickerFilter([(data as Record<string, unknown> | undefined)?.gallery]), admin: { components: { Field: '/components/ProductMediaField#ProductMediaField' } } },
            { name: 'seoTitle', type: 'text', admin: { description: 'Search title. Leave blank to use the product name.' } },
            { name: 'seoTitleMode', type: 'select', defaultValue: 'auto', options: [{ label: 'Auto', value: 'auto' }, { label: 'Custom', value: 'custom' }], admin: { hidden: true } },
            { name: 'seoDescription', type: 'textarea', admin: { description: 'Search description. Leave blank to use the product description.' } },
            { name: 'seoDescriptionMode', type: 'select', defaultValue: 'auto', options: [{ label: 'Auto', value: 'auto' }, { label: 'Custom', value: 'custom' }], admin: { hidden: true } },
            { name: 'seoCanonicalUrl', type: 'text' },
            { name: 'seoNoIndex', type: 'checkbox', defaultValue: false },
          ],
        },
        {
          label: 'Google Merchant Center',
          fields: [
            { name: 'brand', type: 'text', defaultValue: 'Ginny Nana' },
            { name: 'material', type: 'text', defaultValue: 'ABS Plastic' },
            { name: 'color', type: 'text' },
            { name: 'shippingWeight', type: 'number', min: 0.001, defaultValue: 0.2, admin: { description: 'Per-item shipping weight in kilograms, including packaging if applicable. Used by checkout and product feeds; new products default to 0.2 kg.' } },
            { name: 'gender', type: 'select', defaultValue: 'unisex', options: [{ label: 'Female', value: 'female' }, { label: 'Male', value: 'male' }, { label: 'Unisex', value: 'unisex' }] },
            { name: 'ageGroup', type: 'select', defaultValue: 'adult', options: [{ label: 'Adult', value: 'adult' }, { label: 'Kids', value: 'kids' }, { label: 'Toddler', value: 'toddler' }, { label: 'Infant', value: 'infant' }, { label: 'Newborn', value: 'newborn' }] },
            { name: 'condition', type: 'select', defaultValue: 'new', options: [{ label: 'New', value: 'new' }, { label: 'Used', value: 'used' }, { label: 'Refurbished', value: 'refurbished' }] },
            { name: 'adult', type: 'checkbox', defaultValue: false },
            { name: 'multipack', type: 'number', min: 1 },
            { name: 'gtin', type: 'text', admin: { description: 'Optional GTIN. Leave blank when none is assigned.' } },
            { name: 'mpn', type: 'text', admin: { description: 'Optional manufacturer-assigned MPN. Do not invent one.' } },
            { name: 'googleProductCategory', type: 'text', defaultValue: 'Health & Beauty > Personal Care > Cosmetics > Nail Care > False Nails', admin: { components: { Field: '/components/GoogleProductCategoryField#GoogleProductCategoryField' } } },
          ],
        },
        {
          label: 'Publishing',
          fields: [
            { name: 'status', type: 'select', required: true, defaultValue: 'draft', options: [{ label: 'Draft', value: 'draft' }, { label: 'Published', value: 'published' }], admin: { position: 'sidebar' } },
            { name: 'isNew', type: 'checkbox', defaultValue: false },
            { name: 'isBestSeller', type: 'checkbox', defaultValue: false },
          ],
        },
      ],
    },
  ],
}
