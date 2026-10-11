'use client'

import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
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
  const heroProduct = products[0]
  const heroImage = heroProduct?.image?.[0]

  return (
    <main className="bg-[#faf7f5] text-[#271d22]">
      <Navbar />
      <section className="px-3 sm:px-5 lg:px-8 pt-3 sm:pt-5">
        <div className="relative isolate min-h-[650px] overflow-hidden rounded-[1.5rem] bg-[#e8d7d1] sm:min-h-[700px] lg:min-h-[740px]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_76%_39%,#f5e8e2_0%,#dfc3bb_34%,#b78483_75%,#79505f_100%)]" />
          <div className="absolute -right-24 -top-16 h-[38rem] w-[38rem] rounded-full border border-white/30 sm:right-[-5%] sm:top-[-22%] sm:h-[48rem] sm:w-[48rem]" />
          <div className="absolute right-[10%] top-[12%] h-[23rem] w-[23rem] rotate-6 overflow-hidden rounded-[48%_48%_8%_8%] border-[10px] border-white/40 bg-[#f9efeb] shadow-[0_35px_90px_rgba(63,27,46,.28)] sm:right-[13%] sm:top-[11%] sm:h-[32rem] sm:w-[26rem]">
            {heroImage ? <SafeImage unoptimized src={heroImage} alt={heroProduct?.imageAlt?.[0] || heroProduct?.name || 'Ginny Nana press-on nail design'} fill sizes="(max-width: 640px) 72vw, 430px" className="object-cover" priority /> : <div className="h-full w-full bg-[linear-gradient(145deg,#fff7f2_15%,#e6bdb5_54%,#945868)]" />}
          </div>
          <div className="absolute right-[3%] top-[42%] hidden h-44 w-36 -rotate-12 overflow-hidden rounded-[45%_45%_8%_8%] border-[7px] border-white/60 bg-[#e9c7bd] shadow-xl sm:block">
            {products[1]?.image?.[0] && <SafeImage unoptimized src={products[1].image[0]} alt={products[1].imageAlt?.[0] || products[1].name} fill sizes="144px" className="object-cover" />}
          </div>
          <div className="relative z-10 flex min-h-[650px] items-end px-6 pb-10 pt-14 sm:min-h-[700px] sm:px-10 sm:pb-14 lg:min-h-[740px] lg:items-center lg:px-16 lg:py-20">
            <div className="max-w-[610px] rounded-2xl bg-[#fffaf7]/85 p-6 shadow-[0_25px_80px_rgba(50,24,36,.12)] backdrop-blur-md sm:p-10 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-0">
              <p className="text-[10px] uppercase tracking-[0.32em] text-[#794b5d] sm:text-xs">Ginny Nana · Wearable nail art</p>
              <h1 className="mt-5 max-w-xl font-serif text-[2.8rem] leading-[.98] tracking-[-.04em] sm:text-6xl lg:text-[5.5rem]">A fresh set.<br /><span className="italic text-[#904f68]">A whole new mood.</span></h1>
              <p className="mt-5 max-w-md text-sm leading-6 text-[#59444c] sm:text-base sm:leading-7">Salon-inspired press-ons, made for your own rhythm. Find the shape, length, and little details that feel like you.</p>
              <div className="mt-7 flex flex-wrap items-center gap-3 sm:gap-5">
                <Link href="/all-products" className="rounded-full bg-[#2c1b25] px-7 py-3.5 text-sm text-white transition hover:bg-[#75465c]">Shop the collection <span aria-hidden="true">↗</span></Link>
                <span className="text-xs uppercase tracking-[0.14em] text-[#654d55]">Free shipping over $50</span>
              </div>
            </div>
          </div>
          <span className="absolute bottom-7 right-7 hidden text-[10px] uppercase tracking-[.28em] text-white/90 sm:block">Designed to be noticed</span>
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

      <section className="bg-[#261a22] px-5 py-16 text-[#fffaf7] sm:px-8 md:px-12 lg:px-20 md:py-20">
        <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-[#d89caf]">Your manicure, your moment</p>
          <h2 className="font-serif text-3xl md:text-4xl mt-2">Good nails. No appointment.</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
          {values.map(([title, description], index) => (
            <div className="text-center" key={title}>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/5 font-serif text-[#efb5c4]">0{index + 1}</span>
              <h3 className="font-medium mt-4">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/65">{description}</p>
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
