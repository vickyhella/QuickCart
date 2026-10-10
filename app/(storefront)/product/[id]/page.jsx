'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { useAppContext } from '@/context/AppContext'

export default function ProductPage() {
  const { id } = useParams()
  const { products, addToCart, router, currency } = useAppContext()
  const product = products.find((item) => item._id === String(id))
  const [mainImage, setMainImage] = useState('')

  useEffect(() => setMainImage(''), [id])

  if (!products.length) return <main className="min-h-screen bg-[#fffdfa]"><Navbar /><p className="py-32 text-center text-[#786963]">Loading designs…</p><Footer /></main>
  if (!product) return <main className="min-h-screen bg-[#fffdfa]"><Navbar /><div className="py-32 text-center"><h1 className="font-serif text-3xl">This design is unavailable</h1><Link href="/all-products" className="inline-block mt-5 underline">Browse all designs</Link></div><Footer /></main>

  const money = (amount) => `${currency || '$'}${Number(amount).toFixed(2)}`

  return (
    <main className="bg-[#fffdfa] text-[#302522] min-h-screen">
      <Navbar />
      <section className="px-5 md:px-12 lg:px-20 py-10 md:py-16">
        <div className="grid md:grid-cols-2 gap-8 md:gap-14">
          <div>
            <div className="aspect-[4/5] bg-[#f5f0ec] rounded-xl overflow-hidden">
              <Image src={mainImage || product.image[0]} alt={product.name} width={900} height={1125} className="w-full h-full object-cover" priority />
            </div>
            {product.image.length > 1 && <div className="grid grid-cols-5 gap-3 mt-3">{product.image.map((image, index) => <button key={image + index} onClick={() => setMainImage(image)} className="aspect-square rounded-lg overflow-hidden bg-[#f5f0ec]"><Image src={image} alt={`${product.name} view ${index + 1}`} width={180} height={180} className="w-full h-full object-cover" /></button>)}</div>}
          </div>
          <div className="md:py-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[#9a756d]">Handmade press-on nails</p>
            <h1 className="font-serif text-3xl md:text-4xl mt-3">{product.name}</h1>
            <div className="flex items-baseline gap-3 mt-5"><span className="text-xl">{money(product.offerPrice)}</span>{product.price > product.offerPrice && <span className="text-[#998f89] line-through">{money(product.price)}</span>}</div>
            <p className="text-[#6e5c55] leading-7 mt-5 whitespace-pre-line">{product.description}</p>
            <div className="grid grid-cols-2 gap-4 border-y border-[#e8ded8] py-5 mt-7 text-sm">
              <div><p className="text-[#998f89]">Length</p><p className="mt-1 capitalize">{product.length?.replace('-', ' ') || 'Varies by set'}</p></div>
              <div><p className="text-[#998f89]">Shape</p><p className="mt-1 capitalize">{product.shape || 'Varies by set'}</p></div>
              <div><p className="text-[#998f89]">Set</p><p className="mt-1">Reusable press-on nails</p></div>
              {product.sku && <div><p className="text-[#998f89]">SKU</p><p className="mt-1">{product.sku}</p></div>}
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => addToCart(product._id)} className="flex-1 py-3.5 border border-[#754b43] text-[#754b43] rounded-full hover:bg-[#f8f3ef]">Add to cart</button>
              <button onClick={() => { addToCart(product._id); router.push('/cart') }} className="flex-1 py-3.5 bg-[#754b43] text-white rounded-full hover:bg-[#5e3c36]">Buy now</button>
            </div>
            <p className="text-xs text-[#827873] mt-5">Each set is handmade. Product details and sizing can be updated in the product manager.</p>
          </div>
        </div>
      </section>
      <section className="px-5 md:px-12 lg:px-20 py-12 bg-[#f8f3ef]">
        <div className="flex items-end justify-between"><h2 className="font-serif text-3xl">You may also like</h2><Link href="/all-products" className="text-sm underline underline-offset-4">Shop all</Link></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-7 mt-7">{products.filter((item) => item._id !== product._id).slice(0, 4).map((item) => <ProductCard key={item._id} product={item} />)}</div>
      </section>
      <Footer />
    </main>
  )
}
