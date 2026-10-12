import type { CollectionConfig } from 'payload'

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
    beforeValidate: [async ({ data, originalDoc, req }) => {
      if (!data) return data
      const marketing = await req.payload.findGlobal({ slug: 'marketing-settings', overrideAccess: true }).catch(() => null)
      const fillTemplate = (template: string, values: Record<string, string>) => template.replace(/\{(brand|productType|productName|length|shape|size)\}/g, (_, token) => values[token] || '').replace(/\s+/g, ' ').trim()
      const title = String(data.title ?? originalDoc?.title ?? '')
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
      const templateValues = {
        brand: String(data.brand ?? originalDoc?.brand ?? 'Ginny Nana'),
        productType: String(data.category || originalDoc?.category || 'press-on-nails').replaceAll('-', ' '),
        productName: title,
        length: String(data.length ?? originalDoc?.length ?? ''),
        shape: String(data.shape ?? originalDoc?.shape ?? ''),
        size: '',
      }
      if (!String(data.seoTitle ?? originalDoc?.seoTitle ?? '').trim()) data.seoTitle = fillTemplate(String(marketing?.productTitleTemplate || '{brand} {productType} {productName} {length} {shape}'), templateValues)
      if (!String(data.seoDescription ?? originalDoc?.seoDescription ?? '').trim()) data.seoDescription = fillTemplate(String(marketing?.productDescriptionTemplate || '{productName} press-on nails by {brand}.'), templateValues)
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
          price: variant.price ?? data.price,
          compareAtPrice: variant.compareAtPrice ?? data.compareAtPrice,
          stock: variant.stock ?? 10,
          image: variant.image || data.featuredImage,
        }))
      }
      const variantsForDimensions = Array.isArray(data.variants) ? data.variants : originalDoc?.variants
      if (Array.isArray(variantsForDimensions)) {
        data.length = summarizeDimension(variantsForDimensions.map((variant) => variant.length), lengthOrder)
        data.shape = summarizeDimension(variantsForDimensions.map((variant) => variant.shape), shapeOrder)
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
        bulkEdit: {
          Component: '/components/ProductBulkEditor#ProductBulkEditor',
          path: '/bulk-edit',
          exact: true,
        },
        marketing: {
          Component: '/components/MarketingHub#MarketingHub',
          path: '/marketing',
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
            { name: 'description', type: 'textarea', required: true, admin: { rows: 8, description: 'Markdown supported, including images via ![alt](https://...). Raw HTML is not enabled.' } },
            { name: 'price', type: 'number', required: true, min: 0 },
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
            { name: 'seoDescription', type: 'textarea', admin: { description: 'Search description. Leave blank to use the product description.' } },
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
