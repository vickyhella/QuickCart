export function toStorefrontProduct(product) {
  const images = [product.featuredImage, ...(Array.isArray(product.gallery) ? product.gallery : [])]
    .filter((image) => image && typeof image === 'object' && image.url)
  return {
    ...product,
    _id: String(product.id),
    name: product.title,
    image: images.length ? images.map((image) => image.url) : ['/nail-placeholder.svg'],
    imageAlt: images.map((image) => image.altText),
  }
}

// Listing and cart readers need pricing/variants, but not every product's long description or gallery.
export function toStorefrontSummary(product) {
  const { id, title, slug, category, price, compareAtPrice, createdAt, publishedAt, isNew, isBestSeller, length, shape, color, variants } = product
  return { id, title, slug, category, price, compareAtPrice, createdAt, publishedAt, isNew, isBestSeller, length, shape, color, variants,
    featuredImage: product.featuredImage || product.gallery?.[0] || null }
}
