import type { GlobalConfig } from 'payload'
import { defaultProductDimensionOptions } from '../lib/product-dimensions'

const optionFields = [
  { name: 'value', type: 'text' as const, required: true },
  { name: 'label', type: 'text' as const, required: true },
]

export const ProductDimensions: GlobalConfig = {
  slug: 'product-dimensions',
  label: 'Product dimensions',
  admin: { group: false },
  access: {
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'lengths', type: 'array', defaultValue: [...defaultProductDimensionOptions.lengths], fields: optionFields },
    { name: 'shapes', type: 'array', defaultValue: [...defaultProductDimensionOptions.shapes], fields: optionFields },
  ],
}
