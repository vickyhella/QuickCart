type ProductColorSource = {
  color?: unknown
  variants?: { attributes?: Record<string, unknown> | null }[] | null
}

export function getProductColor(product: ProductColorSource) {
  const color = String(product.color || '').trim()
  if (color) return color
  const legacyColors = [...new Set((product.variants || []).map((variant) => String(variant.attributes?.color || '').trim()).filter(Boolean))]
  return legacyColors.length === 1 ? legacyColors[0] : ''
}

export function productVariantAttributeKeys(variants: { attributes?: Record<string, unknown> | null }[]) {
  return [...new Set(variants.flatMap((variant) => Object.keys(variant.attributes || {})).filter((key) => key.toLowerCase() !== 'color'))]
}

export function withoutProductColorVariantAttribute(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  return Object.fromEntries(Object.entries(value).filter(([key]) => key.toLowerCase() !== 'color'))
}

export function matchesProductColor(product: ProductColorSource, selectedColor: string) {
  return !selectedColor || getProductColor(product) === selectedColor
}
