type PriceValue = number | string | null | undefined

export type PriceFields = {
  price?: PriceValue
  compareAtPrice?: PriceValue
}

export type EditorPriceFields = { price?: PriceValue; salePrice?: PriceValue }

function numericPrice(value: PriceValue): number | null {
  if (value === null || value === undefined || value === '') return null
  const price = Number(value)
  return Number.isFinite(price) && price >= 0 ? price : null
}

export function getPriceDetails(product: PriceFields, variant?: PriceFields | null) {
  // Payload price remains the actual charge, including an explicit variant override.
  const currentPrice = numericPrice(variant?.price ?? product.price)
  const compareAtPrice = numericPrice(variant?.compareAtPrice ?? product.compareAtPrice)
  const onSale = currentPrice !== null && compareAtPrice !== null && compareAtPrice > currentPrice

  return {
    price: onSale ? compareAtPrice : currentPrice,
    salePrice: onSale ? currentPrice : null,
    currentPrice,
    onSale,
  }
}

export function toEditorPriceFields(stored: PriceFields, parent?: PriceFields) {
  if (parent && stored.price == null && stored.compareAtPrice == null) return { price: null, salePrice: null }
  const { price, salePrice } = parent ? getPriceDetails(parent, stored) : getPriceDetails(stored)
  return { price, salePrice }
}

export function toStoredPriceFields(editor: EditorPriceFields, original?: PriceFields, parent?: PriceFields) {
  const price = numericPrice(editor.price)
  const salePrice = numericPrice(editor.salePrice)
  for (const [label, input] of [['Price', editor.price], ['Sale price', editor.salePrice]] as const) {
    if (input !== null && input !== undefined && input !== '' && numericPrice(input) === null) throw new Error(`${label} must be a valid non-negative number.`)
  }
  const regularPrice = price ?? (parent ? getPriceDetails(parent).price : null)
  if (salePrice !== null && (regularPrice === null || salePrice >= regularPrice)) throw new Error('Sale price must be lower than Price.')
  if (original) {
    const before = toEditorPriceFields(original, parent)
    // Keep null overrides null when an existing editor pair has not changed.
    if (before.price === price && before.salePrice === salePrice) return { price: numericPrice(original.price), compareAtPrice: numericPrice(original.compareAtPrice) }
  }
  // An explicit regular variant price also overrides the parent's comparison price.
  const compareAtPrice = salePrice !== null ? regularPrice : parent && price !== null ? price : null
  return { price: salePrice ?? price, compareAtPrice }
}
