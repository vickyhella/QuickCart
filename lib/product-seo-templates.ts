export const DEFAULT_PRODUCT_SEO_TITLE = '{brand} {productName} — {availableLengthShapeCombinations}'
export const DEFAULT_PRODUCT_SEO_DESCRIPTION = '{productName} press-on nails by {brand}, available in {availableLengthShapeCombinations} and sizes {availableSizes}.'

const LEGACY_PRODUCT_SEO_TITLE = '{brand} {productType} {productName} {length} {shape}'
const LEGACY_PRODUCT_SEO_DESCRIPTION = '{productName} press-on nails by {brand}.'

export function resolveProductSeoTemplates(settings?: Record<string, unknown> | null) {
  const title = typeof settings?.productTitleTemplate === 'string' ? settings.productTitleTemplate.trim() : ''
  const description = typeof settings?.productDescriptionTemplate === 'string' ? settings.productDescriptionTemplate.trim() : ''

  return {
    title: !title || title === LEGACY_PRODUCT_SEO_TITLE ? DEFAULT_PRODUCT_SEO_TITLE : title,
    description: !description || description === LEGACY_PRODUCT_SEO_DESCRIPTION ? DEFAULT_PRODUCT_SEO_DESCRIPTION : description,
  }
}
