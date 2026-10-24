'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import StorefrontSelect from '@/components/StorefrontSelect'
import { useAppContext } from '@/context/AppContext'
import { getPriceDetails } from '@/lib/product-pricing'
import { getProductColor, matchesProductColor } from '@/lib/product-color'

export default function AllProducts() {
  return <Suspense fallback={<main className="min-h-screen bg-[#fffdfa]" role="status">Loading designs…</main>}><AllProductsContent /></Suspense>
}

function AllProductsContent() {
  const { products, productsStatus, fetchProductData } = useAppContext()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState(() => ({
    length: searchParams.get('length') || '',
    shape: searchParams.get('shape') || '',
    color: searchParams.get('color') || '',
  }))
  const sale = searchParams.get('sale') === 'true'
  const isNew = searchParams.get('isNew') === 'true'

  const visibleProducts = useMemo(() => products.filter((product) => {
    const enabledVariants = (product.variants || []).filter((variant) => variant.enabled !== false)
    if (filters.length && !String(product.length || '').split(',').map((item) => item.trim()).includes(filters.length) && !enabledVariants.some((variant) => variant.length === filters.length)) return false
    if (filters.shape && !String(product.shape || '').split(',').map((item) => item.trim()).includes(filters.shape) && !enabledVariants.some((variant) => variant.shape === filters.shape)) return false
    if (!matchesProductColor(product, filters.color)) return false
    if (sale && !getPriceDetails(product).onSale) return false
    if (isNew && !product.isNew) return false
    return true
  }), [products, filters, sale, isNew])
  const colorOptions = useMemo(() => [...new Set(products.map(getProductColor).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [products])
  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))

  return (
    <main className="bg-[#fffdfa] min-h-screen text-[#302522]">
      <Navbar />
      <section className="storefront-container py-12 md:py-16">
        <p className="text-xs uppercase tracking-[0.25em] text-[#9a756d]">Ginny Nana</p>
        <h1 className="font-serif text-4xl mt-2">All products</h1>
        <div className="storefront-filters">
          <StorefrontSelect ariaLabel="Filter by length" value={filters.length} onChange={(value) => updateFilter('length', value)} active={Boolean(filters.length)} options={[
            { value: '', label: 'All lengths' },
            { value: 'x-short', label: 'X-Short' }, { value: 'short', label: 'Short' }, { value: 'medium', label: 'Medium' }, { value: 'long', label: 'Long' }, { value: 'x-long', label: 'X-Long' },
          ]} />
          <StorefrontSelect ariaLabel="Filter by shape" value={filters.shape} onChange={(value) => updateFilter('shape', value)} active={Boolean(filters.shape)} options={[
            { value: '', label: 'All shapes' },
            ...['square', 'oval', 'almond', 'round'].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) })),
          ]} />
          <StorefrontSelect ariaLabel="Filter by color" value={filters.color} onChange={(value) => updateFilter('color', value)} active={Boolean(filters.color)} options={[
            { value: '', label: 'All colors' },
            ...colorOptions.map((color) => ({ value: color, label: color })),
          ]} />
          <label className="ui-filter"><input type="checkbox" checked={sale} onChange={(event) => {
            const nextSale = event.target.checked
            const params = new URLSearchParams(window.location.search)
            if (nextSale) params.set('sale', 'true')
            else params.delete('sale')
            router.replace(`/all-products${params.size ? `?${params}` : ''}`, { scroll: false })
          }} /> On sale</label>
          <label className="ui-filter"><input type="checkbox" checked={isNew} onChange={(event) => {
            const params = new URLSearchParams(window.location.search)
            if (event.target.checked) params.set('isNew', 'true')
            else params.delete('isNew')
            router.replace(`/all-products${params.size ? `?${params}` : ''}`, { scroll: false })
          }} /> New arrivals</label>
        </div>
        {visibleProducts.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-7 mt-9">
            {visibleProducts.map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        ) : productsStatus === 'loading' ? (
          <p className="mt-12 py-16 text-center bg-[#f8f3ef] rounded-xl text-[#786963]" role="status">Loading designs…</p>
        ) : productsStatus === 'error' ? (
          <div className="mt-12 py-16 text-center bg-[#f8f3ef] rounded-xl text-[#786963]" role="alert"><p>We couldn’t load the collection.</p><button type="button" onClick={fetchProductData} className="mt-3 underline">Try again</button></div>
        ) : (
          <p className="mt-12 py-16 text-center bg-[#f8f3ef] rounded-xl text-[#786963]">No designs match these filters yet.</p>
        )}
      </section>
      <Footer />
    </main>
  )
}
