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
