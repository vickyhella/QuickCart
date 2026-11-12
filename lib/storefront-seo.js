export const storefrontOrigin = 'https://ginnynana.com'

export function productUrl(product, variant) {
  const url = new URL(`/product/${encodeURIComponent(product.slug || product.id)}/`, storefrontOrigin)
  if (variant?.id) url.searchParams.set('variant', String(variant.id))
  return url
}

export function productCanonical(product) {
  const custom = product.seoCanonicalUrl?.trim()
  if (custom && URL.canParse(custom, storefrontOrigin)) {
    const url = new URL(custom, storefrontOrigin)
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.href
  }
  return productUrl(product).href
}
