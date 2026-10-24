'use client'

import { useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { useAppContext } from '@/context/AppContext'
import Link from 'next/link'
import { formatDimension } from '@/lib/format-dimension'
import { productDimensionValues, productMatchesDimension } from '@/lib/product-dimensions'

const defaults = {
  length: ['x-short', 'short', 'medium', 'long', 'x-long'],
  shape: ['square', 'oval', 'almond', 'round'],
}

export default function ProductDimensionFilter({ dimension }) {
  const { products, storefrontNavigation } = useAppContext()
  const [selected, setSelected] = useState('')
  const label = dimension === 'length' ? 'Length' : 'Shape'
  const configured = dimension === 'length' ? storefrontNavigation.lengths : storefrontNavigation.shapes
  const options = useMemo(() => {
    const source = configured.length ? configured : [...new Set(productDimensionValues(products, dimension).map((value) => ({ value, label: formatDimension(value), image: null })))]
    return source.map((option) => ({ ...option, value: String(option.value) })).sort((a, b) => (defaults[dimension].indexOf(a.value) < 0 ? 99 : defaults[dimension].indexOf(a.value)) - (defaults[dimension].indexOf(b.value) < 0 ? 99 : defaults[dimension].indexOf(b.value)))
  }, [configured, dimension, products])
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get(dimension)
    if (value && options.some((option) => option.value === value)) setSelected(value)
  }, [dimension, options])
  const matching = useMemo(() => products.filter((product) => productMatchesDimension(product, dimension, selected)), [dimension, products, selected])

  return <main className="min-h-screen bg-[#fffdfa] text-[#302522]">
    <Navbar />
    <section className="px-5 md:px-12 lg:px-20 py-12 md:py-16">
      <p className="text-xs uppercase tracking-[0.25em] text-[#9a756d]">Ginny Nana</p>
      <h1 className="font-serif text-4xl mt-2">By {label}</h1>
      {selected && <Link href={`/${dimension === 'length' ? 'by-length' : 'by-shape'}`} onClick={() => setSelected('')} className="inline-block mt-4 text-sm text-[#8b5e70] hover:underline">← All {dimension === 'length' ? 'lengths' : 'shapes'}</Link>}
      {!selected && <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {options.map((option, index) => <Link key={option.value} href={`/${dimension === 'length' ? 'by-length' : 'by-shape'}?${dimension}=${encodeURIComponent(option.value)}`} onClick={() => setSelected(option.value)} className="store-category-option">
          {option.image?.url ? <img src={option.image.url} alt="" loading={index === 0 ? 'eager' : 'lazy'} className="store-category-option__image" /> : <div className="store-category-option__image store-category-option__image--empty" />}
          <span className="store-category-option__name">{option.label || formatDimension(option.value)}</span>
        </Link>)}
      </div>}
      {selected ? <>
        <h2 className="font-serif text-2xl mt-9">{formatDimension(selected)} designs</h2>
        {matching.length ? <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-7 mt-6">{matching.map((product) => <ProductCard key={product._id} product={product} />)}</div> : <p className="mt-6 py-12 text-center bg-[#f8f3ef] rounded-xl text-[#786963]">No designs use this {label.toLowerCase()} yet.</p>}
      </> : null}
    </section>
    <Footer />
  </main>
}
