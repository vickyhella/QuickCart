import { isAdminUser } from '../lib/admin-access'
import type { GlobalConfig } from 'payload'
import { defaultProductDimensionOptions } from '../lib/product-dimensions'
import { invalidateStorefront, STOREFRONT_NAVIGATION_TAG } from '../lib/storefront-cache'

const optionFields = [
  { name: 'value', type: 'text' as const, required: true },
  { name: 'label', type: 'text' as const, required: true },
]

export const ProductDimensions: GlobalConfig = {
  slug: 'product-dimensions',
  label: 'Product dimensions',
  admin: { group: false },
  hooks: {
    afterChange: [async ({ doc }) => { await invalidateStorefront(STOREFRONT_NAVIGATION_TAG); return doc }],
  },
  access: {
    read: ({ req }) => isAdminUser(req.user),
    update: ({ req }) => isAdminUser(req.user),
  },
  fields: [
    { name: 'lengths', type: 'array', defaultValue: [...defaultProductDimensionOptions.lengths], fields: optionFields },
    { name: 'shapes', type: 'array', defaultValue: [...defaultProductDimensionOptions.shapes], fields: optionFields },
    { name: 'dimensions', type: 'json', defaultValue: [{ key: 'quantity', label: 'Quantity', valueType: 'integer', options: [] }] },
  ],
}
