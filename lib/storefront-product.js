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
