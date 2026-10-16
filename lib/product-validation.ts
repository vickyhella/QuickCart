import { getPriceDetails, type PriceFields } from './product-pricing'

type PublishProduct = { title?: unknown; price?: unknown; salePrice?: unknown; hasImage: boolean; variants?: { enabled?: boolean; stock?: unknown; length?: unknown; shape?: unknown; size?: unknown; price?: unknown; salePrice?: unknown }[] }

export function productPublishError(product: PublishProduct) {
  const price = Number(product.price)
  const validPrice = product.price !== undefined && product.price !== null && product.price !== '' && Number.isFinite(price) && price >= 0
  const salePrice = product.salePrice === undefined || product.salePrice === null || product.salePrice === '' ? null : Number(product.salePrice)
  const validSalePrice = (basePrice: unknown, offer: unknown) => {
    if (offer === undefined || offer === null || offer === '') return true
    const amount = Number(offer)
    const base = Number(basePrice)
    return Number.isFinite(amount) && amount >= 0 && Number.isFinite(base) && amount < base
  }
  const validProductSalePrice = validSalePrice(product.price, salePrice)
  const validVariantSalePrices = !Array.isArray(product.variants) || product.variants.every((variant) =>
    variant.enabled === false || validSalePrice(variant.price ?? product.price, variant.price == null ? variant.salePrice ?? salePrice : variant.salePrice),
  )
  const hasAvailableVariant = Array.isArray(product.variants) && product.variants.some((variant) =>
    variant.enabled !== false && Number(variant.stock) > 0 && Boolean(variant.length && variant.shape && variant.size),
  )
  if (!String(product.title || '').trim()) return 'To publish, add a product name.'
  if (!validPrice) return 'To publish, enter a valid Price.'
  if (!validProductSalePrice) return 'To publish, Sale price must be lower than Price.'
  if (!validVariantSalePrices) return 'To publish, each variant Sale price must be lower than its Price.'
  if (!product.hasImage) return 'To publish, add at least one product image.'
  if (!hasAvailableVariant) return 'To publish, enable at least one variant with available stock.'
  return null
}

export function storedProductPublishError(product: Omit<PublishProduct, 'price' | 'salePrice' | 'variants'> & PriceFields & { variants?: (NonNullable<PublishProduct['variants']>[number] & PriceFields)[] }) {
  return productPublishError({ ...product, ...getPriceDetails(product), variants: product.variants?.map((variant) => ({ ...variant, ...getPriceDetails(product, variant) })) })
}
