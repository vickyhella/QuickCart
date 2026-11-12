import { notFound } from 'next/navigation'
import { storefrontOrigin } from '@/lib/storefront-seo'
import { storefrontCollections } from '@/lib/storefront-collections'
import Catalog, { catalogPage } from '../../all-products/Catalog'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params, searchParams }) {
  const { collection } = await params
  const info = Object.hasOwn(storefrontCollections, collection) && storefrontCollections[collection]
  if (!info) return {}
  const page = catalogPage((await searchParams).page)
  const suffix = page > 1 ? `?page=${page}` : ''
  return {
    title: `${info.title} | Ginny Nana`,
    description: info.description,
    alternates: { canonical: `${storefrontOrigin}/collections/${collection}/${suffix}` },
  }
}

export default async function CollectionPage({ params, searchParams }) {
  const { collection } = await params
  if (!Object.hasOwn(storefrontCollections, collection)) notFound()
  const info = storefrontCollections[collection]
  return <Catalog path={`/collections/${collection}/`} query={{ page: (await searchParams).page, ...info.filters }} collection={info} />
}
