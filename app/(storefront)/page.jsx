'use client'

import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { useAppContext } from '@/context/AppContext'

const values = [
  ['Handmade', 'Designed and finished by hand.'],
  ['Reusable', 'Keep the set and wear it again.'],
  ['Easy to apply', 'A polished manicure in about ten minutes.'],
  ['Made to last', 'Up to four weeks with nail glue.'],
]

export default function Home() {
  const { products, productsStatus, fetchProductData } = useAppContext()
  const newProducts = products.filter((product) => product.isNew)
  const visibleProducts = newProducts.length ? newProducts : products
  const heroProduct = products[0]
  const heroImage = heroProduct?.image?.[0] || '/media/ginny-nana-press-on-nails-test1-01.webp'

  return (
    <main className="bg-[#fffdf7] text-[#201d1b]">
      <Navbar />

      <section className="px-3 pt-3 sm:px-5 sm:pt-5 lg:px-8">
        <div className="grid overflow-hidden bg-[#254bd8] lg:min-h-[680px] lg:grid-cols-[.88fr_1.12fr]">
          <div className="order-2 flex flex-col justify-center bg-[#f6ed55] px-6 py-9 sm:px-10 sm:py-12 lg:order-1 lg:px-14 lg:py-16 xl:px-20">
            <p className="text-xs font-semibold tracking-[0.16em] text-[#254bd8]">Ginny Nana · Handmade press-ons</p>
            <h1 className="mt-5 max-w-[620px] font-serif text-[3.35rem] leading-[.93] tracking-[-.055em] sm:text-7xl lg:text-[4.8rem] xl:text-[5rem]">
              A little art.<br />A lot of you.
            </h1>
            <p className="mt-6 max-w-md text-[15px] leading-7 text-[#393720] sm:text-base">
              Wearable nail designs, made by hand and ready when you are. Find a set that feels like your kind of statement.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link href="/all-products" className="inline-flex min-h-12 items-center justify-center bg-[#e64d35] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#c93d2a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#201d1b]">
                Shop the collection
              </Link>
              <span className="text-xs font-medium text-[#393720]">Free shipping over $50</span>
            </div>
            <div className="mt-10 hidden items-center gap-3 text-xs font-semibold text-[#254bd8] sm:flex">
              <span className="h-px w-10 bg-[#254bd8]" />
              Made to match your mood
            </div>
          </div>

          <div className="relative order-1 min-h-[390px] overflow-hidden bg-[#254bd8] sm:min-h-[520px] lg:order-2 lg:min-h-[680px]">
            {heroImage ? (
              <SafeImage
                unoptimized
                src={heroImage}
                alt={heroProduct?.imageAlt?.[0] || heroProduct?.name || 'Ginny Nana handmade press-on nails worn on a hand'}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover object-center"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_55%_40%,#f6ed55_0%,#f6ed55_13%,#254bd8_13.3%,#254bd8_100%)]" />
            )}
            <span className="absolute bottom-4 right-4 bg-[#f6ed55] px-3 py-2 text-[10px] font-semibold tracking-[.08em] text-[#201d1b] sm:bottom-6 sm:right-6 sm:px-4 sm:py-3 sm:text-xs">YOUR NEXT FAVORITE SET</span>
          </div>
        </div>
      </section>

      <section aria-label="Why Ginny Nana" className="border-b border-[#e9e5d9] px-5 py-5 sm:px-8 lg:px-16">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-8 gap-y-2 text-center text-[11px] font-semibold tracking-[.08em] sm:justify-between sm:text-xs">
          <span>HANDMADE WITH CARE</span>
          <span>REUSABLE BY DESIGN</span>
          <span>READY IN MINUTES</span>
          <span>FREE SHIPPING OVER $50</span>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 md:py-20 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[.12em] text-[#254bd8]">THE LATEST SETS</p>
              <h2 className="mt-2 font-serif text-4xl tracking-[-.04em] sm:text-5xl">Fresh off the nail desk</h2>
            </div>
            <Link href="/all-products" className="shrink-0 border-b border-[#e64d35] pb-1 text-sm font-semibold hover:text-[#c93d2a]">Shop all</Link>
          </div>
          {visibleProducts.length ? (
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-7">
              {visibleProducts.slice(0, 4).map((product) => <ProductCard key={product._id} product={product} />)}
            </div>
          ) : productsStatus === 'loading' ? (
            <div className="mt-8 bg-[#f5f1e7] py-12 text-center text-sm text-[#766f62]" role="status">Loading designs…</div>
          ) : productsStatus === 'error' ? (
            <div className="mt-8 bg-[#f5f1e7] py-12 text-center text-sm text-[#766f62]" role="alert">
              <p>We couldn’t load the collection.</p>
              <button type="button" onClick={fetchProductData} className="mt-3 underline underline-offset-4">Try again</button>
            </div>
          ) : (
            <div className="mt-8 bg-[#f5f1e7] py-12 text-center text-sm text-[#766f62]">New designs are on the way. Check back soon.</div>
          )}
        </div>
      </section>

      <section className="px-3 pb-16 sm:px-5 lg:px-8 lg:pb-20">
        <div className="mx-auto grid max-w-[1440px] gap-3 md:grid-cols-2">
          <Link href="/by-shape" className="group flex min-h-[240px] flex-col justify-between bg-[#254bd8] p-7 text-white transition-colors hover:bg-[#1c3db8] sm:min-h-[300px] sm:p-10">
            <span className="text-xs font-semibold tracking-[.14em] text-[#f6ed55]">FIND YOUR SHAPE</span>
            <span className="flex items-end justify-between gap-4">
              <span className="font-serif text-4xl leading-none tracking-[-.04em] sm:text-6xl">Almond, oval<br />or square?</span>
              <span aria-hidden="true" className="text-3xl transition-transform group-hover:translate-x-1">↗</span>
            </span>
          </Link>
          <Link href="/by-length" className="group flex min-h-[240px] flex-col justify-between bg-[#e64d35] p-7 text-white transition-colors hover:bg-[#c93d2a] sm:min-h-[300px] sm:p-10">
            <span className="text-xs font-semibold tracking-[.14em] text-[#fff0a4]">PICK YOUR LENGTH</span>
            <span className="flex items-end justify-between gap-4">
              <span className="font-serif text-4xl leading-none tracking-[-.04em] sm:text-6xl">Short and sweet<br />or full drama?</span>
              <span aria-hidden="true" className="text-3xl transition-transform group-hover:translate-x-1">↗</span>
            </span>
          </Link>
        </div>
      </section>

      <section className="bg-[#201d1b] px-5 py-16 text-[#fffdf7] sm:px-8 md:py-20 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[.14em] text-[#f6ed55]">GOOD NAILS, NO APPOINTMENT</p>
            <h2 className="mt-3 font-serif text-4xl tracking-[-.04em] sm:text-5xl">Your manicure, your moment.</h2>
          </div>
          <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
            {values.map(([title, description]) => (
              <div className="border-t border-white/25 pt-4" key={title}>
                <h3 className="font-semibold text-[#f6ed55]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
