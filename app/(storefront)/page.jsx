'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { useAppContext } from '@/context/AppContext'

const values = [
  ['Handmade', 'Designed and finished by hand for a salon-quality look.'],
  ['Reusable', 'Wear again with a little care between applications.'],
  ['Easy to apply', 'A polished manicure in about ten minutes at home.'],
  ['Made to last', 'Enjoy your set for up to four weeks with nail glue.'],
]

export default function Home() {
  const { products } = useAppContext()
  const newProducts = products.filter((product) => product.isNew)
  const visibleProducts = newProducts.length ? newProducts : products

  return (
    <main className="bg-[#fffdfa] text-[#302522]">
      <Navbar />
      <section className="px-5 md:px-12 lg:px-20 pt-8">
        <div className="relative overflow-hidden rounded-2xl bg-[#f4e9e2] min-h-[430px] md:min-h-[520px] flex items-center">
          <div className="max-w-2xl px-8 py-16 md:px-16 md:py-24 relative z-10">
            <p className="text-xs uppercase tracking-[0.28em] text-[#8b5e56]">Ginny Nana · Press-on nails</p>
            <h1 className="font-serif text-4xl md:text-6xl leading-[1.08] mt-5">A little art for your fingertips.</h1>
            <p className="text-[#6e5c55] mt-5 max-w-lg leading-7">Natural-looking, reusable press-on nails designed for everyday elegance and made to feel like you.</p>
            <div className="flex flex-wrap items-center gap-4 mt-8">
              <Link href="/all-products" className="px-7 py-3 bg-[#754b43] text-white text-sm rounded-full hover:bg-[#5e3c36] transition">Shop the collection</Link>
              <span className="text-sm text-[#6e5c55]">Free shipping over $50</span>
            </div>
          </div>
          <div aria-hidden="true" className="hidden md:block absolute right-[-3%] bottom-[-32%] w-[48%] aspect-square rounded-full border border-white/70 bg-[radial-gradient(circle_at_35%_30%,#fff8f3_0,#e8cfc2_48%,#d6b5a5_100%)]" />
          <div aria-hidden="true" className="hidden md:block absolute right-[10%] top-[18%] w-48 h-64 rotate-[-14deg] rounded-[55%_55%_48%_48%] border-[10px] border-[#f9efeb] bg-gradient-to-b from-[#fff5f0] to-[#d89d91] shadow-xl" />
          <div aria-hidden="true" className="hidden md:block absolute right-[25%] top-[32%] w-36 h-52 rotate-[12deg] rounded-[55%_55%_48%_48%] border-[9px] border-[#f9efeb] bg-gradient-to-b from-[#fff5f0] to-[#d89d91] shadow-lg" />
        </div>
      </section>

      <section className="px-5 md:px-12 lg:px-20 py-16 md:py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#9a756d]">The collection</p>
            <h2 className="font-serif text-3xl md:text-4xl mt-2">New arrivals</h2>
          </div>
          <Link href="/all-products" className="text-sm underline underline-offset-4">Shop all</Link>
        </div>
        {visibleProducts.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-7 mt-8">
            {visibleProducts.slice(0, 4).map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        ) : (
          <div className="mt-8 rounded-xl bg-[#f8f3ef] py-12 text-center text-sm text-[#786963]">New designs are on the way. Check back soon.</div>
        )}
      </section>

      <section className="bg-[#f8f3ef] px-5 md:px-12 lg:px-20 py-16 md:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[#9a756d]">Why press-on nails?</p>
          <h2 className="font-serif text-3xl md:text-4xl mt-2">Your ritual, made easy</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
          {values.map(([title, description], index) => (
            <div className="text-center" key={title}>
              <span className="inline-flex w-10 h-10 rounded-full bg-white items-center justify-center text-[#8b5e56] font-serif">0{index + 1}</span>
              <h3 className="font-medium mt-4">{title}</h3>
              <p className="text-sm leading-6 text-[#786963] mt-2">{description}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="px-5 md:px-12 lg:px-20 py-14 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-[#9a756d]">Find your fit</p>
        <h2 className="font-serif text-3xl mt-2">A shape and length for every day</h2>
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          {['x-short', 'short', 'medium', 'long', 'x-long'].map((length) => <Link key={length} href={`/all-products?length=${length}`} className="rounded-full border border-[#d8c9c1] px-5 py-2 text-sm hover:bg-[#f8f3ef] capitalize">{length.replace('-', ' ')}</Link>)}
          <Link href="/all-products?shape=almond" className="rounded-full border border-[#d8c9c1] px-5 py-2 text-sm hover:bg-[#f8f3ef]">Almond</Link>
          <Link href="/all-products?shape=oval" className="rounded-full border border-[#d8c9c1] px-5 py-2 text-sm hover:bg-[#f8f3ef]">Oval</Link>
        </div>
      </section>
      <Footer />
    </main>
  )
}
