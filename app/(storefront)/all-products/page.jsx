import { storefrontOrigin } from '@/lib/storefront-seo'
import Catalog, { catalogPage, catalogFilters } from './Catalog'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }) {
  const query = await searchParams
  const page = catalogPage(query.page)
  return {
    title: 'Shop Handmade Press-On Nails | Ginny Nana',
    description: 'Browse handmade press-on nails by length, shape and color. Find your next set and check its available sizes.',
    alternates: { canonical: storefrontOrigin + '/all-products/' + (page > 1 ? `?page=${page}` : '') },
    ...(catalogFilters.some((key) => query[key]) ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function AllProducts({ searchParams }) {
  return <Catalog path="/all-products/" query={await searchParams} />
}
