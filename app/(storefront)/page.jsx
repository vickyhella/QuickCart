import { getHomepageSettings } from '@/lib/homepage-settings'
import { selectHomepageProducts } from '@/lib/homepage-products'
import { getPublishedCatalog } from '@/lib/storefront-catalog'
import { toStorefrontProduct, toStorefrontSummary } from '@/lib/storefront-product'
import { storefrontOrigin } from '@/lib/storefront-seo'
import HomeClient from './HomeClient'

export const dynamic = 'force-dynamic'
export const metadata = { alternates: { canonical: storefrontOrigin + '/' } }

export default async function HomePage() {
  const [catalog, settings] = await Promise.all([getPublishedCatalog(), getHomepageSettings()])
  const selection = selectHomepageProducts(catalog.map((product) => ({ ...product, _id: String(product.id) })), settings.featured.productKeys)
  return <HomeClient selection={{ ...selection, products: selection.products.map((product) => toStorefrontProduct(toStorefrontSummary(product))) }} />
}
