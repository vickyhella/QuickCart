type DimensionProduct = { [key: string]: any; variants?: { enabled?: boolean; [key: string]: any }[] }

export const defaultProductDimensionOptions = {
  lengths: [
    { value: 'x-short', label: 'X-Short' },
    { value: 'short', label: 'Short' },
    { value: 'medium', label: 'Medium' },
    { value: 'long', label: 'Long' },
    { value: 'x-long', label: 'X-Long' },
  ],
  shapes: [
    { value: 'square', label: 'Square' },
    { value: 'oval', label: 'Oval' },
    { value: 'almond', label: 'Almond' },
    { value: 'round', label: 'Round' },
  ],
} as const

export function productUsesDimensionValue(product: DimensionProduct, dimension: 'length' | 'shape', value: string) {
  const variants = product.variants || []
  if (variants.some((variant) => String(variant[dimension] || '').trim() === value)) return true
  return String(product[dimension] || '').split(',').map((item: string) => item.trim()).includes(value)
}

export function uniqueLengthShapePairs(variants: { length?: string; shape?: string }[]) {
  return [...new Map(variants.filter((variant) => variant.length && variant.shape).map((variant) => [`${variant.length}|${variant.shape}`, { length: variant.length!, shape: variant.shape! }])).values()]
}

export function productDimensionValues(products: DimensionProduct[], dimension: string) {
  return [...new Set(products.flatMap((product) => {
    const allVariants = product.variants || []
    return allVariants.length
      ? allVariants.filter((variant) => variant.enabled !== false).map((variant) => variant[dimension]).filter(Boolean)
      : String(product[dimension] || '').split(',').map((value) => value.trim()).filter(Boolean)
  }))]
}

export function productCardDimensions(product: DimensionProduct) {
  const variants = product.variants || []
  if (variants.length) {
    const enabled = variants.filter((variant) => variant.enabled !== false)
    const shapes = [...new Set(enabled.map((variant) => variant.shape).filter(Boolean))]
    return shapes.length ? shapes : [...new Set(enabled.map((variant) => variant.length).filter(Boolean))]
  }
  return [product.length, product.shape].filter(Boolean)
}

export function productMatchesDimension(product: DimensionProduct, dimension: string, selected: string) {
  const allVariants = product.variants || []
  return allVariants.length
    ? allVariants.some((variant) => variant.enabled !== false && variant[dimension] === selected)
    : String(product[dimension] || '').split(',').map((value) => value.trim()).includes(selected)
}
