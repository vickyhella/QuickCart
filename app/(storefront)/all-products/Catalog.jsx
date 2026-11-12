import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { getPublishedCatalog } from '@/lib/storefront-catalog'
import { toStorefrontProduct, toStorefrontSummary } from '@/lib/storefront-product'
import { getPriceDetails } from '@/lib/product-pricing'
import { getProductColor, matchesProductColor } from '@/lib/product-color'
import { isStorefrontNew } from '@/lib/product-newness'
import { storefrontCollections } from '@/lib/storefront-collections'
import CatalogFilters from './CatalogFilters'

export const catalogFilters = ['length', 'shape', 'color', 'sale', 'isNew']
export const catalogPage = (value) => typeof value === 'string' && /^[1-9]\d*$/.test(value) ? Number(value) : 1
const pageSize = 24

export default async function Catalog({ path, query, collection }) {
  const products = await getPublishedCatalog()
  const filters = Object.fromEntries(catalogFilters.map((key) => [key, typeof query[key] === 'string' ? query[key] : '']))
  const visible = products.filter((product) => {
    const variants = (product.variants || []).filter((variant) => variant.enabled !== false)
    const matchesDimensions = (item) => ['length', 'shape'].every((key) =>
      !filters[key] || String(item[key] || '').split(',').some((value) => value.trim() === filters[key]))
    if (!(variants.length ? variants.some(matchesDimensions) : matchesDimensions(product))) return false
    if (!matchesProductColor(product, filters.color)) return false
    if (filters.sale === 'true' && !getPriceDetails(product).onSale) return false
    return filters.isNew !== 'true' || isStorefrontNew(product)
  })
  const page = catalogPage(query.page)
  const total = Math.max(1, Math.ceil(visible.length / pageSize))
  if (page > total) notFound()
  const colors = [...new Set(products.map(getProductColor).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  const pageUrl = (number) => {
    const params = new URLSearchParams(collection ? {} : Object.entries(filters).filter(([, value]) => value))
    if (number > 1) params.set('page', String(number))
    return path + (params.size ? `?${params}` : '')
  }

  return <main className="bg-[#fffdfa] min-h-screen text-[#302522]">
    <Navbar />
    <section className="storefront-container py-12 md:py-16">
      <h1 className="font-serif text-4xl">{collection?.title || 'All products'}</h1>
      {collection ? <p className="mt-3 max-w-xl">{collection.description} <Link href="/size-guide/" className="underline">Size guide</Link></p> : <>
        <nav aria-label="Shop collections" className="mt-4 flex flex-wrap gap-4">
          {Object.entries(storefrontCollections).map(([slug, info]) => <Link key={slug} href={`/collections/${slug}/`} className="underline">{info.title}</Link>)}
        </nav>
        <CatalogFilters filters={filters} colors={colors} />
      </>}
      {visible.length ? <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-7 mt-9">
        {visible.slice((page - 1) * pageSize, page * pageSize).map((product) =>
          <ProductCard key={product.id} product={toStorefrontProduct(toStorefrontSummary(product))} />)}
      </div> : <p className="mt-12 py-16 text-center">No designs match these filters yet.</p>}
      {total > 1 && <nav aria-label="Product pages" className="mt-8 flex flex-wrap items-center gap-4">
        {page > 1 && <Link className="ui-button ui-button--secondary" href={pageUrl(page - 1)}>Previous</Link>}
        <span>Page {page} of {total}</span>
        {page < total && <Link className="ui-button ui-button--secondary" href={pageUrl(page + 1)}>Next</Link>}
      </nav>}
    </section>
    <Footer />
  </main>
}
