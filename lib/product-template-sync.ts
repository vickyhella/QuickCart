import { DEFAULT_STUDIO_DESCRIPTION_TEMPLATE, renderStudioDescription } from './studio-description-template'

const DEFAULT_SEO_TITLE_TEMPLATE = '{brand} {productType} {productName} {availableLengthShapeCombinations}'
const DEFAULT_SEO_DESCRIPTION_TEMPLATE = '{productName} press-on nails by {brand}.'
const lengthOrder = ['x-short', 'short', 'medium', 'long', 'x-long']
const shapeOrder = ['square', 'oval', 'almond', 'round']

function summarize(values: unknown[], order: string[]) {
  const unique = [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))]
  unique.sort((a, b) => {
    const left = order.indexOf(a)
    const right = order.indexOf(b)
    return (left < 0 ? 100 : left) - (right < 0 ? 100 : right) || a.localeCompare(b)
  })
  return unique.join(', ')
}

function templateValues(product: Record<string, any>) {
  const variants = (Array.isArray(product.variants) ? product.variants : []).filter((variant: any) => variant.enabled !== false)
  const pairs = [...new Set(variants.map((variant: any) => `${variant.length} ${variant.shape}`))]
  const availableSizes = [...new Set(variants.map((variant: any) => String(variant.size || '').toUpperCase()).filter(Boolean))].join(', ')
  return {
    brand: String(product.brand || 'Ginny Nana'),
    productType: String(product.category || 'press-on-nails').replaceAll('-', ' '),
    productName: String(product.title || ''),
    length: summarize(variants.map((variant: any) => variant.length), lengthOrder),
    shape: summarize(variants.map((variant: any) => variant.shape), shapeOrder),
    availableLengthShapeCombinations: pairs.join(', '),
    availableSizes,
    size: availableSizes,
  }
}

function renderSEO(template: string, values: Record<string, string>) {
  return template.replace(/\{(brand|productType|productName|length|shape|size|availableLengthShapeCombinations|availableSizes)\}/g, (_, token: string) => values[token] || '').replace(/\s+/g, ' ').trim()
}

function isAutoOrUnmarkedMatch(product: Record<string, any>, modeKey: string, valueKey: string, previousGenerated: string) {
  const mode = product[modeKey]
  if (mode === 'auto') return true
  if (mode === 'custom' || (mode !== undefined && mode !== null && mode !== '')) return false
  return !product[valueKey] || product[valueKey] === previousGenerated
}

export function productTemplateRefreshFields(product: Record<string, any>, previous: Record<string, any>, next: Record<string, any>) {
  const oldDescription = String(previous.studioDescriptionTemplate || DEFAULT_STUDIO_DESCRIPTION_TEMPLATE)
  const newDescription = String(next.studioDescriptionTemplate || DEFAULT_STUDIO_DESCRIPTION_TEMPLATE)
  const oldTitle = String(previous.productTitleTemplate || DEFAULT_SEO_TITLE_TEMPLATE)
  const newTitle = String(next.productTitleTemplate || DEFAULT_SEO_TITLE_TEMPLATE)
  const oldSeoDescription = String(previous.productDescriptionTemplate || DEFAULT_SEO_DESCRIPTION_TEMPLATE)
  const newSeoDescription = String(next.productDescriptionTemplate || DEFAULT_SEO_DESCRIPTION_TEMPLATE)
  const values = templateValues(product)
  const result: Record<string, 'auto'> = {}

  if (oldDescription !== newDescription && isAutoOrUnmarkedMatch(product, 'descriptionMode', 'description', renderStudioDescription(oldDescription, values))) result.descriptionMode = 'auto'
  if (oldTitle !== newTitle && isAutoOrUnmarkedMatch(product, 'seoTitleMode', 'seoTitle', renderSEO(oldTitle, values))) result.seoTitleMode = 'auto'
  if (oldSeoDescription !== newSeoDescription && isAutoOrUnmarkedMatch(product, 'seoDescriptionMode', 'seoDescription', renderSEO(oldSeoDescription, values))) result.seoDescriptionMode = 'auto'
  return result
}
