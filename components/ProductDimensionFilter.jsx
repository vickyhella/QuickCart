'use client'

import { useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { useAppContext } from '@/context/AppContext'
import { formatDimension } from '@/lib/format-dimension'
import { productDimensionValues, productMatchesDimension } from '@/lib/product-dimensions'

const defaults = {
  length: ['x-short', 'short', 'medium', 'long', 'x-long'],
  shape: ['square', 'oval', 'almond', 'round'],
}

export default function ProductDimensionFilter({ dimension }) {
  const { products } = useAppContext()
  const [selected, setSelected] = useState('')
  const label = dimension === 'length' ? 'Length' : 'Shape'
  const options = useMemo(() => [...new Set([
    ...productDimensionValues(products, dimension),
  ])].sort((a, b) => (defaults[dimension].indexOf(a) < 0 ? 99 : defaults[dimension].indexOf(a)) - (defaults[dimension].indexOf(b) < 0 ? 99 : defaults[dimension].indexOf(b)) || a.localeCompare(b)), [dimension, products])
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get(dimension)
    if (value && options.includes(value)) setSelected(value)
  }, [dimension, options])
  const matching = useMemo(() => products.filter((product) => productMatchesDimension(product, dimension, selected)), [dimension, products, selected])

  return <main className="min-h-screen bg-[#fffdfa] text-[#302522]">
    <Navbar />
    <section className="px-5 md:px-12 lg:px-20 py-12 md:py-16">
      <p className="text-xs uppercase tracking-[0.25em] text-[#9a756d]">Ginny Nana</p>
      <h1 className="font-serif text-4xl mt-2">By {label}</h1>
      <label className="block max-w-sm mt-7 text-sm text-[#6e5c55]">Choose a {label.toLowerCase()}
        <select value={selected} onChange={(event) => setSelected(event.target.value)} className="block w-full mt-2 rounded-lg border border-[#d8c9c1] bg-white px-4 py-3 capitalize text-[#302522]">
          <option value="">Select {label.toLowerCase()}</option>
          {options.map((option) => <option key={option} value={option}>{formatDimension(option)}</option>)}
        </select>
      </label>
      {selected ? <>
        <h2 className="font-serif text-2xl mt-9">{formatDimension(selected)} designs</h2>
        {matching.length ? <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-7 mt-6">{matching.map((product) => <ProductCard key={product._id} product={product} />)}</div> : <p className="mt-6 py-12 text-center bg-[#f8f3ef] rounded-xl text-[#786963]">No designs use this {label.toLowerCase()} yet.</p>}
      </> : <p className="mt-8 py-10 text-center bg-[#f8f3ef] rounded-xl text-[#786963]">Select a {label.toLowerCase()} to see matching designs.</p>}
    </section>
    <Footer />
  </main>
}
