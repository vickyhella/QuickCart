type Relation = string | number | { id?: string | number } | null | undefined

type PublishedProductMedia = {
  featuredImage?: Relation
  gallery?: Relation[]
  variants?: { image?: Relation }[]
}

export function getPublishedProductMediaIDs(products: PublishedProductMedia[]) {
  const ids = new Set<string>()
  const add = (relation: Relation) => {
    const id = relation && typeof relation === 'object' ? relation.id : relation
    if (id != null && String(id)) ids.add(String(id))
  }

  for (const product of products) {
    add(product.featuredImage)
    product.gallery?.forEach(add)
    product.variants?.forEach((variant) => add(variant.image))
  }

  return [...ids]
}

const byRequest = new WeakMap<object, Promise<string[]>>()

export function getPublicMediaIDsForRequest(req: any): Promise<string[]> {
  let ids = byRequest.get(req)
  if (!ids) {
    ids = Promise.all([
      req.payload.find({
        collection: 'products', where: { status: { equals: 'published' } },
        limit: 10000, pagination: false, depth: 0, overrideAccess: true, req,
        select: { featuredImage: true, gallery: true, variants: { image: true } },
      }),
      req.payload.findGlobal({ slug: 'marketing-settings', depth: 0, overrideAccess: true, req, select: { homepageHeroImage: true, homepageMysteryBoxImage: true } }),
      req.payload.findGlobal({ slug: 'product-dimensions', depth: 0, overrideAccess: true, req, select: { dimensions: true } }),
    ]).then(([products, marketing, dimensions]) => {
      const categories = Array.isArray(dimensions.dimensions) ? dimensions.dimensions.find((item: any) => item?.key === '__category-preview-images') : null
      const categoryImages = Array.isArray(categories?.options) ? categories.options : []
      return getPublishedProductMediaIDs([
        ...products.docs,
        { featuredImage: marketing.homepageHeroImage, gallery: [marketing.homepageMysteryBoxImage, ...categoryImages.map((item: any) => item.image)] },
      ])
    })
    byRequest.set(req, ids)
  }
  return ids
}
