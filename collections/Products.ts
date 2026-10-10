import type { CollectionConfig } from 'payload'

const lengthCodeMap: Record<string, string> = { 'x-short': '01', short: '02', medium: '03', long: '04', 'x-long': '05' }
const shapeCodeMap: Record<string, string> = { square: '01', oval: '02', almond: '03', round: '04' }
const sizeCodeMap: Record<string, string> = { xs: '01', s: '02', m: '03', l: '04' }

function dimensionCode(value: string, presets: Record<string, string>, values: string[]) {
  if (presets[value]) return presets[value]
  const customValues = [...new Set(values.filter((entry) => !presets[entry]))].sort()
  return String(50 + Math.max(0, customValues.indexOf(value))).padStart(2, '0')
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
      return data
    }],
  },
  access: {
    read: ({ req }) =>
      req.user ? true : { status: { equals: 'published' } },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'sku', 'price', 'status', 'updatedAt'],
    description: 'Manage press-on nail designs, images, prices, and publishing status.',
    components: {
      beforeList: ['/components/ProductBulkEditor#ProductBulkEditLink'],
      beforeDocumentControls: ['/components/ProductBulkEditor#EditVariantsInSpreadsheetButton'],
      views: {
        bulkEdit: {
          Component: '/components/ProductBulkEditor#ProductBulkEditor',
          path: '/bulk-edit',
          exact: true,
        },
      },
    },
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    { name: 'sku', type: 'text', admin: { position: 'sidebar' } },
    { name: 'brand', type: 'text', defaultValue: 'Ginny Nana', admin: { position: 'sidebar' } },
    { name: 'material', type: 'text', defaultValue: 'ABS Plastic', admin: { position: 'sidebar', description: 'Merchant Center material. Default is ABS Plastic; enter another material when adding a product.' } },
    { name: 'color', type: 'text', admin: { position: 'sidebar' } },
    { name: 'gender', type: 'select', defaultValue: 'unisex', options: [{ label: 'Female', value: 'female' }, { label: 'Male', value: 'male' }, { label: 'Unisex', value: 'unisex' }], admin: { position: 'sidebar' } },
    { name: 'ageGroup', type: 'select', defaultValue: 'adult', options: [{ label: 'Adult', value: 'adult' }, { label: 'Kids', value: 'kids' }, { label: 'Toddler', value: 'toddler' }, { label: 'Infant', value: 'infant' }, { label: 'Newborn', value: 'newborn' }], admin: { position: 'sidebar' } },
    { name: 'condition', type: 'select', defaultValue: 'new', options: [{ label: 'New', value: 'new' }, { label: 'Used', value: 'used' }, { label: 'Refurbished', value: 'refurbished' }], admin: { position: 'sidebar' } },
    { name: 'adult', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar', description: 'Enable only for sexually suggestive or adult content.' } },
    { name: 'multipack', type: 'number', min: 1, admin: { position: 'sidebar', description: 'Only set when the offer bundles multiple identical products.' } },
    { name: 'gtin', type: 'text', admin: { position: 'sidebar', description: 'Optional GTIN. Leave blank when none is assigned.' } },
    { name: 'mpn', type: 'text', admin: { position: 'sidebar', description: 'Optional manufacturer-assigned MPN. Do not invent one; blank outputs identifier_exists=false if GTIN is also absent.' } },
    { name: 'googleProductCategory', type: 'select', defaultValue: 'Health & Beauty > Personal Care > Cosmetics > Nail Care > False Nails', options: [
      { label: 'False Nails (recommended)', value: 'Health & Beauty > Personal Care > Cosmetics > Nail Care > False Nails' },
      { label: 'Nail Care', value: 'Health & Beauty > Personal Care > Cosmetics > Nail Care' },
      { label: 'Nail Polish', value: 'Health & Beauty > Personal Care > Cosmetics > Nail Care > Nail Polish' },
      { label: 'Cosmetics', value: 'Health & Beauty > Personal Care > Cosmetics' },
    ], admin: { position: 'sidebar', description: 'Google product category. Select the closest matching taxonomy category.' } },
    { name: 'seoTitle', type: 'text', admin: { position: 'sidebar' } },
    { name: 'seoDescription', type: 'textarea', admin: { position: 'sidebar' } },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      admin: { rows: 8, description: 'Markdown supported, including images via ![alt](https://...). Raw HTML is not enabled.' },
    },
    { name: 'price', type: 'number', required: true, min: 0 },
    {
      name: 'compareAtPrice',
      type: 'number',
      min: 0,
      admin: { description: 'Optional original price, shown crossed out.' },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'press-on-nails',
      options: [
        { label: 'Press-on Nails', value: 'press-on-nails' },
        { label: 'Nail Care', value: 'nail-care' },
        { label: 'Accessories', value: 'accessories' },
        { label: 'Mystery Box', value: 'mystery-box' },
      ],
    },
    { name: 'length', type: 'text', admin: { description: 'Product-level length label. Variant lengths can be added in the spreadsheet variant editor.' } },
    { name: 'shape', type: 'text', admin: { description: 'Product-level shape label. Variant shapes can be added in the spreadsheet variant editor.' } },
    {
      name: 'variants',
      type: 'array',
      labels: { singular: 'Variant', plural: 'Variants' },
      admin: {
        description: 'Create one row for each shape, length, and size combination. Leave variant prices blank to use the product price.',
      },
      fields: [
        { name: 'sku', type: 'text', required: true, index: true },
        { name: 'length', type: 'text', required: true },
        { name: 'shape', type: 'text', required: true },
        { name: 'size', type: 'select', defaultValue: 's', options: [
          { label: 'XS', value: 'xs' }, { label: 'S', value: 's' }, { label: 'M', value: 'm' }, { label: 'L', value: 'l' },
        ] },
        { name: 'price', type: 'number', min: 0 },
        { name: 'compareAtPrice', type: 'number', min: 0 },
        { name: 'gtin', type: 'text', admin: { hidden: true } },
        { name: 'mpn', type: 'text', admin: { hidden: true } },
        { name: 'image', type: 'upload', relationTo: 'media', admin: { description: 'Optional image for this exact variant. Falls back to the product image.' } },
        { name: 'stock', type: 'number', min: 0, defaultValue: 10 },
        { name: 'trackStock', type: 'checkbox', defaultValue: true },
        { name: 'enabled', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'gallery',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'isNew', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    { name: 'isBestSeller', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
  ],
}
