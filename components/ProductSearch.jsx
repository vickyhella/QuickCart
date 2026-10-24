'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { productSearchURL } from '@/lib/product-search'
import { toStorefrontProduct } from '@/lib/storefront-product'

export default function ProductSearch({ query, page }) {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!query) return
    const controller = new AbortController()
    fetch(productSearchURL(query, page), { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('We couldn’t search the collection. Please try again.')
        return response.json()
      })
      .then(setResult)
      .catch((requestError) => { if (requestError.name !== 'AbortError') setError(requestError.message) })
    return () => controller.abort()
  }, [query, page])

  const pageURL = (number) => `/search?${new URLSearchParams({ q: query, page: String(number) })}`

  return <main className="min-h-screen bg-[#fffdfa] text-[#302522]">
    <Navbar />
    <section className="px-5 py-12 md:px-12 md:py-16 lg:px-20">
      <h1 className="font-serif text-4xl">Search products</h1>
      <form action="/search" role="search" className="mt-6 flex max-w-xl gap-2">
        <label className="sr-only" htmlFor="product-search">Product name</label>
        <input id="product-search" type="search" name="q" defaultValue={query} maxLength={160} placeholder="Search by product name" className="min-w-0 flex-1 rounded-lg border border-[#d8c9c1] bg-white px-4 py-3" />
        <button className="ui-button ui-button--primary">Search</button>
      </form>
      {!query ? <p className="mt-8 text-sm text-[#786963]">Enter a product name to find your next design.</p> : error ? <p role="alert" className="mt-8 text-red-700">{error}</p> : !result ? <p role="status" className="mt-8 text-sm text-[#786963]">Searching…</p> : <>
        <p role="status" className="mt-8 text-sm text-[#786963]">{result.totalDocs} {result.totalDocs === 1 ? 'product' : 'products'} for “{query}”</p>
        {result.docs.length ? <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-7 lg:grid-cols-4">
          {result.docs.map((product) => <ProductCard key={product.id} product={toStorefrontProduct(product)} />)}
        </div> : <p className="mt-7 text-sm text-[#786963]">No products found. Try a shorter name or another spelling.</p>}
        {(result.hasPrevPage || result.hasNextPage) && <nav aria-label="Search results pages" className="mt-9 flex items-center gap-5 text-sm">
          {result.hasPrevPage && <Link className="underline" href={pageURL(result.prevPage)}>Previous</Link>}
          <span>Page {result.page} of {result.totalPages}</span>
          {result.hasNextPage && <Link className="underline" href={pageURL(result.nextPage)}>Next</Link>}
        </nav>}
      </>}
    </section>
    <Footer />
  </main>
}
