function mediaID(value) {
  if (value && typeof value === 'object' && 'id' in value) return String(value.id)
  return value === null || value === undefined || value === '' ? '' : String(value)
}

/** Resolve upload relationships nested in product arrays even when Payload returns only their IDs. */
export async function resolveProductMedia(payload, products) {
  const ids = new Set()
  for (const product of products) {
    for (const value of [product.featuredImage, ...(product.gallery || []), ...(product.variants || []).map((variant) => variant.image)]) {
      const id = mediaID(value)
      if (id && !(value && typeof value === 'object' && value.url)) ids.add(id)
    }
  }
  const media = ids.size ? await payload.find({
    collection: 'media',
    where: { id: { in: [...ids] } },
    limit: ids.size,
    depth: 0,
    overrideAccess: true,
  }) : { docs: [] }
  const byID = new Map(media.docs.map((item) => [String(item.id), item]))
  const resolve = (value) => value && typeof value === 'object' && value.url ? value : byID.get(mediaID(value)) || null
  return products.map((product) => ({
    ...product,
    featuredImage: resolve(product.featuredImage),
    gallery: (product.gallery || []).map(resolve).filter(Boolean),
    variants: (product.variants || []).map((variant) => ({ ...variant, image: resolve(variant.image) })),
  }))
}
