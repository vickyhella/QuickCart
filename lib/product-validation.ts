export function productPublishError(product: { title?: unknown; price?: unknown; hasImage: boolean; variants?: { enabled?: boolean; stock?: unknown; length?: unknown; shape?: unknown; size?: unknown }[] }) {
  const price = Number(product.price)
  const validPrice = product.price !== undefined && product.price !== null && product.price !== '' && Number.isFinite(price) && price >= 0
  const hasAvailableVariant = Array.isArray(product.variants) && product.variants.some((variant) =>
    variant.enabled !== false && Number(variant.stock) > 0 && Boolean(variant.length && variant.shape && variant.size),
  )
  return String(product.title || '').trim() && validPrice && product.hasImage && hasAvailableVariant
    ? null
    : 'To publish, add a product name, valid base price, at least one image, and an enabled in-stock variant.'
}
