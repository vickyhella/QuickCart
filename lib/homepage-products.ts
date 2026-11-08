type HomepageProduct = { _id: string; slug?: string }

export function selectHomepageProducts<T extends HomepageProduct>(products: T[], productKeys: string[] = []) {
  const picks = productKeys.flatMap((key) => {
    const product = products.find((item) => String(item._id) === key || item.slug === key)
    return product ? [product] : []
  })
  const uniquePicks = [...new Map(picks.map((product) => [product._id, product])).values()].slice(0, 6)
  return {
    products: uniquePicks.length ? uniquePicks : products.slice(0, 6),
    curated: uniquePicks.length > 0,
  }
}
