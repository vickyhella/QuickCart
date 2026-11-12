import { storefrontCollections } from '@/lib/storefront-collections'
import { getPublishedCatalog } from '@/lib/storefront-catalog'
import { productCanonical, productUrl, storefrontOrigin } from '@/lib/storefront-seo'

export const dynamic = 'force-dynamic'

export default async function sitemap() {
  const products = await getPublishedCatalog()
  const pages = ['/', '/all-products/', '/by-length/', '/by-shape/', '/size-guide/', '/how-to-apply/', '/what-you-will-get/', '/about-us/', '/shipping-policy/', '/refunds-returns/']
  return [
    ...Object.keys(storefrontCollections).map((slug) => ({ url: `${storefrontOrigin}/collections/${slug}/` })),
    ...pages.map((path) => ({ url: storefrontOrigin + path })),
    ...products.filter((product) => !product.seoNoIndex && productCanonical(product) === productUrl(product).href)
      .map((product) => ({ url: productUrl(product).href })),
  ]
}
