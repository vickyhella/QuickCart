'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
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

  return (
    <main className="bg-[#fffdfa] min-h-screen text-[#302522]">
      <Navbar />
      <section className="px-5 md:px-12 lg:px-20 py-12 md:py-16">
        <p className="text-xs uppercase tracking-[0.25em] text-[#9a756d]">Ginny Nana</p>
        <h1 className="font-serif text-4xl mt-2">All products</h1>
        <div className="flex flex-wrap gap-2 mt-6">
          <select aria-label="Filter by length" value={filters.length} onChange={(event) => setFilters({ ...filters, length: event.target.value })} className="rounded-full border border-[#d8c9c1] px-4 py-2 text-sm bg-white">
            <option value="">All lengths</option>
            <option value="x-short">X-Short</option><option value="short">Short</option><option value="medium">Medium</option><option value="long">Long</option><option value="x-long">X-Long</option>
          </select>
          <select aria-label="Filter by shape" value={filters.shape} onChange={(event) => setFilters({ ...filters, shape: event.target.value })} className="rounded-full border border-[#d8c9c1] px-4 py-2 text-sm bg-white capitalize">
            <option value="">All shapes</option>
            <option value="square">Square</option><option value="oval">Oval</option><option value="almond">Almond</option><option value="round">Round</option>
          </select>
          <select aria-label="Filter by color" value={filters.color} onChange={(event) => setFilters({ ...filters, color: event.target.value })} className="rounded-full border border-[#d8c9c1] px-4 py-2 text-sm bg-white">
            <option value="">All colors</option>{colorOptions.map((color) => <option key={color} value={color}>{color}</option>)}
          </select>
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
