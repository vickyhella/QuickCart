import { isAdminUser } from '../lib/admin-access'
import type { CollectionConfig } from 'payload'
import { hideSupplierDetails } from '@/lib/product-privacy'
import { storedProductPublishError } from '@/lib/product-validation'
import { DEFAULT_STUDIO_DESCRIPTION_TEMPLATE, renderStudioDescription } from '@/lib/studio-description-template'
import { DEFAULT_NEW_ARRIVAL_DAYS, isWithinNewArrivalDays } from '@/lib/product-newness'

const lengthCodeMap: Record<string, string> = {
  'x-short': '01',
  short: '02',
  medium: '03',
  long: '04',
  'x-long': '05',
}
const shapeCodeMap: Record<string, string> = {
  square: '01',
  oval: '02',
  almond: '03',
  round: '04',
}
const sizeCodeMap: Record<string, string> = {
  xs: '01',
  s: '02',
  m: '03',
  l: '04',
}

async function syncLinkedProductCounts(req: any, values: unknown[]) {
  const ids = new Set(values.map((value: any) => String(value && typeof value === 'object' ? value.id : value ?? '')).filter(Boolean))
  for (const id of ids) {
    const [{ totalDocs }, supplier] = await Promise.all([
      req.payload.count({ collection: 'products', where: { suppliers: { equals: Number(id) } }, overrideAccess: true, req }),
      req.payload.findByID({ collection: 'suppliers', id, depth: 0, overrideAccess: true, req }).catch(() => null),
    ])
    if (supplier && supplier.linkedProductsCount !== totalDocs) {
      await req.payload.update({ collection: 'suppliers', id, data: { linkedProductsCount: totalDocs }, overrideAccess: true, req })
    }
  }
}

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
  return String(value && typeof value === 'object' ? value.id : (value ?? ''))
}

const marketingSettingsByRequest = new WeakMap<object, Promise<Record<string, unknown>>>()

function getMarketingSettingsForRequest(req: any) {
  let settings = marketingSettingsByRequest.get(req)
  if (!settings) {
    settings = req.payload.findGlobal({ slug: 'marketing-settings', depth: 0, overrideAccess: true })
      .then((value: Record<string, unknown>) => value)
      .catch(() => ({}))
    marketingSettingsByRequest.set(req, settings)
  }
  return settings
}

function webpPickerFilter(values: unknown[]) {
  const existingIDs = [
    ...new Set(
      values.flatMap((value) => {
        if (Array.isArray(value)) return value.map(relationID).filter(Boolean)
        const id = relationID(value)
        return id ? [id] : []
      }),
    ),
  ]
  return existingIDs.length
    ? {
        or: [{ mimeType: { equals: 'image/webp' } }, { id: { in: existingIDs } }],
      }
    : { mimeType: { equals: 'image/webp' } }
}

async function nextProductCode(req: any) {
  const result = await req.payload.find({
    collection: 'products',
    limit: 10000,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  const highest = result.docs.reduce((max, product) => {
    const code = String(product.sku || '')
    return /^\d{4}$/.test(code) ? Math.max(max, Number(code)) : max
  }, 0)
  return String(highest + 1).padStart(4, '0')
}

export const Products: CollectionConfig = {
  slug: 'products',
  hooks: {
    beforeChange: [({ data, originalDoc }) => {
      if (!data) return data
      if (data.status === 'draft') return { ...data, publishedAt: null }
      if (originalDoc?.status === 'published') return { ...data, publishedAt: originalDoc.publishedAt || data.publishedAt || null }
      if ((data.status ?? originalDoc?.status) === 'published') return { ...data, publishedAt: new Date().toISOString() }
      return data
    }],
    afterChange: [async ({ doc, previousDoc, req }) => {
      await syncLinkedProductCounts(req, [...(previousDoc?.suppliers || []), ...(doc?.suppliers || [])])
      return doc
    }],
    afterDelete: [async ({ doc, req }) => {
      await syncLinkedProductCounts(req, doc?.suppliers || [])
    }],
    afterRead: [async ({ doc, req }) => {
      if (!doc) return doc
      if (doc.status === 'published') {
        const marketing = await getMarketingSettingsForRequest(req)
        const newArrivalDays = marketing.newArrivalDays ?? DEFAULT_NEW_ARRIVAL_DAYS
        const automaticNew = isWithinNewArrivalDays(doc.publishedAt || doc.createdAt, newArrivalDays)
        const manualNew = Boolean(doc.isNew)
        const storefrontIsNew = manualNew || automaticNew
        if (isAdminUser(req.user)) {
          return {
            ...doc,
            storefrontIsNew,
            storefrontNewStatus: manualNew && automaticNew ? 'Manual + automatic' : manualNew ? 'Manual' : automaticNew ? 'Automatic' : 'Not new',
          } as any
        }
        return hideSupplierDetails({ ...doc, isNew: storefrontIsNew } as any)
      }
      return isAdminUser(req.user) ? doc : hideSupplierDetails(doc as any)
    }],
    beforeValidate: [
      async ({ data, originalDoc, req }) => {
        if (!data) return data
        const marketing = await req.payload.findGlobal({ slug: 'marketing-settings', overrideAccess: true }).catch(() => null)
        const fillTemplate = (template: string, values: Record<string, string>) =>
          template
            .replace(/\{(brand|productType|productName|length|shape|size|availableLengthShapeCombinations|availableSizes)\}/g, (_, token) => values[token] || '')
            .replace(/\s+/g, ' ')
            .trim()
        const title = String(data.title ?? originalDoc?.title ?? '')
        const descriptionMode = data.descriptionMode ?? (originalDoc && data.description !== undefined && data.description !== originalDoc.description ? 'custom' : (originalDoc?.descriptionMode ?? (originalDoc?.description ? 'custom' : 'auto')))
        const seoTitleMode = data.seoTitleMode ?? (originalDoc && data.seoTitle !== undefined && data.seoTitle !== originalDoc.seoTitle ? 'custom' : (originalDoc?.seoTitleMode ?? (originalDoc?.seoTitle ? 'custom' : 'auto')))
        const seoDescriptionMode = data.seoDescriptionMode ?? (originalDoc && data.seoDescription !== undefined && data.seoDescription !== originalDoc.seoDescription ? 'custom' : (originalDoc?.seoDescriptionMode ?? (originalDoc?.seoDescription ? 'custom' : 'auto')))
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
          length: summarizeDimension(
            activeDimensions.map((variant: any) => variant.length),
            lengthOrder,
          ),
          shape: summarizeDimension(
            activeDimensions.map((variant: any) => variant.shape),
            shapeOrder,
          ),
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
        } else if (!data.sku) data.sku = originalDoc.sku || (await nextProductCode(req))
        const productCode = /^\d{4}$/.test(String(data.sku))
          ? String(data.sku)
          : String(originalDoc?.id || 0)
              .padStart(4, '0')
              .slice(-4)
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
          const message = storedProductPublishError({
            title: product.title,
            category: product.category,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            hasImage,
            variants: product.variants,
          })
          if (message) throw new Error(message)
        }
        return data
      },
    ],
  },
  access: {
    read: ({ req }) => (isAdminUser(req.user) ? true : { status: { equals: 'published' } }),
    create: ({ req }) => isAdminUser(req.user),
    update: ({ req }) => isAdminUser(req.user),
    // Product deletion is available only through the guarded admin control/API.
    delete: () => false,
  },
  admin: {
    group: false,
    useAsTitle: 'title',
    pagination: { defaultLimit: 10, limits: [10, 25, 50, 100] },
    defaultColumns: ['featuredImage', 'title', 'sku', 'price', 'purchaseURL', 'status', 'createdAt', 'updatedAt', 'actions'],
    description: 'Manage press-on nail designs, images, prices, and publishing status.',
    components: {
      beforeList: ['/components/ProductWorkspaceTabs#ProductWorkspaceTabs', '/components/ProductListActions#ProductListActions', '/components/ProductBulkEditor#ProductMediaAudit'],
      edit: {
        beforeDocumentControls: ['/components/ProductWorkspaceTabs#ProductWorkspaceTabs', '/components/ProductDeleteControl#ProductDeleteControl'],
      },
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
        categories: {
          Component: '/components/ProductCategoriesView#ProductCategoriesView',
          path: '/categories',
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
            { name: 'title', type: 'text', required: true, admin: { width: '50%' } },
            { name: 'chineseName', type: 'text', label: 'Chinese Name', admin: { width: '50%', description: 'Internal reference only; not shown to customers.' } },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              index: true,
              admin: {
                components: {
                  Field: '/components/ProductSlugField#ProductSlugField',
                },
              },
            },
            {
              name: 'description',
              type: 'textarea',
              admin: {
                rows: 8,
                description: 'Markdown supported, including images via ![alt](https://...). Raw HTML is not enabled.',
              },
            },
            {
              name: 'descriptionMode',
              type: 'select',
              defaultValue: 'auto',
              options: [
                { label: 'Auto', value: 'auto' },
                { label: 'Custom', value: 'custom' },
              ],
              admin: { hidden: true },
            },
            { name: 'price', type: 'number', min: 0, label: 'Price', admin: { components: { Field: '/components/ProductPricingField#ProductPricingField', Cell: '/components/ProductPricingField#ProductPriceCell' } } },
            {
              name: 'compareAtPrice',
              type: 'number',
              min: 0,
              admin: {
                hidden: true,
              },
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
            {
              name: 'length',
              type: 'text',
              admin: {
                readOnly: true,
                description: 'Automatically follows the variant lengths (comma separated when multiple).',
              },
            },
            {
              name: 'shape',
              type: 'text',
              admin: {
                readOnly: true,
                description: 'Automatically follows the variant shapes (comma separated when multiple).',
              },
            },
            { name: 'sku', type: 'text', admin: { position: 'sidebar' } },
            {
              name: 'supplierSKU',
              type: 'text',
              admin: {
                hidden: true,
                description: 'Legacy WooCommerce supplier SKU retained for reference.',
              },
            },
            {
              name: 'suppliers',
              type: 'relationship',
              relationTo: 'suppliers',
              hasMany: true,
              admin: { position: 'sidebar', allowCreate: true, allowEdit: true },
            },
            {
              name: 'purchaseURL',
              type: 'text',
              label: 'Product Purchase URL',
              admin: {
                position: 'sidebar',
                description: 'URL for purchasing this specific product. Separate from the supplier storefront URL.',
                components: { Field: '/components/PurchaseURLField#ProductPurchaseURLField', Cell: '/components/PurchaseURLField#ProductPurchaseURLCell' },
              },
            },
            {
              name: 'studioRequestID',
              type: 'text',
              unique: true,
              admin: { hidden: true },
            },
          ],
        },
        {
          label: 'Variants',
          fields: [
            {
              name: 'variants',
              type: 'array',
              labels: { singular: 'Variant', plural: 'Variants' },
              admin: {
                description: 'Create one row for each shape, length, and size combination. Leave variant prices blank to use the product price.',
                components: {
                  Field: '/components/ProductVariantsSpreadsheetField#ProductVariantsSpreadsheetField',
                },
              },
              fields: [
                { name: 'sku', type: 'text', index: true },
                { name: 'length', type: 'text' },
                { name: 'shape', type: 'text' },
                { name: 'attributes', type: 'json', defaultValue: {} },
                {
                  name: 'size',
                  type: 'select',
                  defaultValue: 's',
                  options: [
                    { label: 'XS', value: 'xs' },
                    { label: 'S', value: 's' },
                    { label: 'M', value: 'm' },
                    { label: 'L', value: 'l' },
                  ],
                },
                { name: 'price', type: 'number', min: 0, label: 'Price' },
                { name: 'compareAtPrice', type: 'number', min: 0 },
                { name: 'gtin', type: 'text', admin: { hidden: true } },
                { name: 'mpn', type: 'text', admin: { hidden: true } },
                {
                  name: 'supplierSKU',
                  type: 'text',
                  admin: {
                    hidden: true,
                    description: 'Legacy WooCommerce supplier SKU retained for reference.',
                  },
                },
                {
                  name: 'suppliers',
                  type: 'relationship',
                  relationTo: 'suppliers',
                  hasMany: true,
                  admin: { allowCreate: true, allowEdit: true },
                },
                {
                  name: 'purchaseURL',
                  type: 'text',
                  admin: {
                    hidden: true,
                    description: 'Internal purchasing URL; never exposed publicly.',
                  },
                },
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  filterOptions: ({ siblingData }) => webpPickerFilter([(siblingData as Record<string, unknown> | undefined)?.image]),
                  admin: {
                    description: 'Optional WebP image for this exact variant. Falls back to the product image.',
                  },
                },
                { name: 'stock', type: 'number', min: 0, defaultValue: 10 },
                { name: 'trackStock', type: 'checkbox', defaultValue: true },
                { name: 'enabled', type: 'checkbox', defaultValue: true },
              ],
            },
          ],
        },
        {
          label: 'Media & SEO',
          fields: [
            {
              name: 'featuredImage',
              type: 'upload',
              relationTo: 'media',
              filterOptions: ({ data }) => webpPickerFilter([(data as Record<string, unknown> | undefined)?.featuredImage]),
              admin: {
                components: {
                  Field: '/components/ProductMediaField#ProductMediaField',
                  Cell: '/components/ProductThumbnailCell#ProductThumbnailCell',
                },
              },
            },
            {
              name: 'gallery',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              filterOptions: ({ data }) => webpPickerFilter([(data as Record<string, unknown> | undefined)?.gallery]),
              admin: {
                components: {
                  Field: '/components/ProductMediaField#ProductMediaField',
                },
              },
            },
            {
              name: 'seoTitle',
              type: 'text',
              admin: {
                description: 'Search title. Leave blank to use the product name.',
              },
            },
            {
              name: 'seoTitleMode',
              type: 'select',
              defaultValue: 'auto',
              options: [
                { label: 'Auto', value: 'auto' },
                { label: 'Custom', value: 'custom' },
              ],
              admin: { hidden: true },
            },
            {
              name: 'seoDescription',
              type: 'textarea',
              admin: {
                description: 'Search description. Leave blank to use the product description.',
              },
            },
            {
              name: 'seoDescriptionMode',
              type: 'select',
              defaultValue: 'auto',
              options: [
                { label: 'Auto', value: 'auto' },
                { label: 'Custom', value: 'custom' },
              ],
              admin: { hidden: true },
            },
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
            {
              name: 'shippingWeight',
              type: 'number',
              min: 0.001,
              defaultValue: 0.2,
              admin: {
                description: 'Per-item shipping weight in kilograms, including packaging if applicable. Used by checkout and product feeds; new products default to 0.2 kg.',
              },
            },
            {
              name: 'gender',
              type: 'select',
              defaultValue: 'unisex',
              options: [
                { label: 'Female', value: 'female' },
                { label: 'Male', value: 'male' },
                { label: 'Unisex', value: 'unisex' },
              ],
            },
            {
              name: 'ageGroup',
              type: 'select',
              defaultValue: 'adult',
              options: [
                { label: 'Adult', value: 'adult' },
                { label: 'Kids', value: 'kids' },
                { label: 'Toddler', value: 'toddler' },
                { label: 'Infant', value: 'infant' },
                { label: 'Newborn', value: 'newborn' },
              ],
            },
            {
              name: 'condition',
              type: 'select',
              defaultValue: 'new',
              options: [
                { label: 'New', value: 'new' },
                { label: 'Used', value: 'used' },
                { label: 'Refurbished', value: 'refurbished' },
              ],
            },
            { name: 'adult', type: 'checkbox', defaultValue: false },
            { name: 'multipack', type: 'number', min: 1 },
            {
              name: 'gtin',
              type: 'text',
              admin: {
                description: 'Optional GTIN. Leave blank when none is assigned.',
              },
            },
            {
              name: 'mpn',
              type: 'text',
              admin: {
                description: 'Optional manufacturer-assigned MPN. Do not invent one.',
              },
            },
            {
              name: 'googleProductCategory',
              type: 'text',
              defaultValue: 'Health & Beauty > Personal Care > Cosmetics > Nail Care > False Nails',
              admin: {
                components: {
                  Field: '/components/GoogleProductCategoryField#GoogleProductCategoryField',
                },
              },
            },
          ],
        },
        {
          label: 'Publishing',
          fields: [
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
            { name: 'publishedAt', type: 'date', admin: { hidden: true, readOnly: true } },
            { name: 'isNew', type: 'checkbox', defaultValue: false },
            { name: 'isBestSeller', type: 'checkbox', defaultValue: false },
          ],
        },
      ],
    },
    {
      name: 'actions',
      type: 'ui',
      label: 'Action',
      admin: {
        disableListColumn: false,
        width: '220px',
        components: {
          Cell: '/components/ProductActionCell#ProductActionCell',
          Field: '/components/ProductActionCell#ProductActionCell',
        },
      },
    },
  ],
}
