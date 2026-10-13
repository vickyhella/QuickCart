type DimensionProduct = { [key: string]: any; variants?: { enabled?: boolean; [key: string]: any }[] }

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
