'use client'

import { useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { useAppContext } from '@/context/AppContext'

export default function AllProducts() {
  const { products } = useAppContext()
  const [filters, setFilters] = useState({ length: '', shape: '', sale: false, isNew: false })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setFilters({
      length: params.get('length') || '',
      shape: params.get('shape') || '',
      sale: params.get('sale') === 'true',
      isNew: params.get('isNew') === 'true',
    })
  }, [])

  const visibleProducts = useMemo(() => products.filter((product) => {
    const enabledVariants = (product.variants || []).filter((variant) => variant.enabled !== false)
    if (filters.length && product.length !== filters.length && !enabledVariants.some((variant) => variant.length === filters.length)) return false
    if (filters.shape && product.shape !== filters.shape && !enabledVariants.some((variant) => variant.shape === filters.shape)) return false
    if (filters.sale && !(product.price > product.offerPrice)) return false
    if (filters.isNew && !product.isNew) return false
    return true
  }), [products, filters])

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
          <label className="flex items-center gap-2 rounded-full border border-[#d8c9c1] px-4 py-2 text-sm bg-white"><input type="checkbox" checked={filters.sale} onChange={(event) => setFilters({ ...filters, sale: event.target.checked })} /> On sale</label>
          <label className="flex items-center gap-2 rounded-full border border-[#d8c9c1] px-4 py-2 text-sm bg-white"><input type="checkbox" checked={filters.isNew} onChange={(event) => setFilters({ ...filters, isNew: event.target.checked })} /> New arrivals</label>
        </div>
        {visibleProducts.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-7 mt-9">
            {visibleProducts.map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        ) : (
          <p className="mt-12 py-16 text-center bg-[#f8f3ef] rounded-xl text-[#786963]">No designs match these filters yet.</p>
        )}
      </section>
      <Footer />
    </main>
  )
}
