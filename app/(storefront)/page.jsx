'use client'

import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import NailMotif from '@/components/NailMotif'
import NewsletterSignup from '@/components/NewsletterSignup'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useAppContext } from '@/context/AppContext'
import { getPriceDetails } from '@/lib/product-pricing'
import { isStorefrontNew } from '@/lib/product-newness'
import { getProductColor } from '@/lib/product-color'

const values = [
  ['Handmade', 'Designed and finished by hand.'],
  ['Reusable', 'Keep the set and wear it again.'],
  ['Easy to apply', 'A polished manicure in about ten minutes.'],
  ['Made to last', 'Up to four weeks with nail glue.'],
]

export default function Home() {
  const { products, productsStatus, fetchProductData, currency, shippingSettings, homepageSettings } = useAppContext()
  const newProducts = products.filter(isStorefrontNew)
  const visibleProducts = newProducts.length ? newProducts : products
  const heroProduct = products[0]
  const colorOptions = Array.from(products.reduce((counts, product) => {
    const color = getProductColor(product)
    if (color) counts.set(color, (counts.get(color) || 0) + 1)
    return counts
  }, new Map()), ([color, count]) => ({ color, count })).sort((a, b) => b.count - a.count || a.color.localeCompare(b.color)).slice(0, 6)
  const hero = homepageSettings.hero
  const heroImage = hero.image
  const heroAlt = hero.alt

  return (
    <main className="bg-[#fbf8f5] text-[#291b2d]">
      <Navbar />

      <section className="bg-[#fbf8f5] px-0 pt-0">
        <div className="storefront-container storefront-card grid bg-[#eee5f2] lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[640px]">
          <div className="order-2 flex flex-col justify-center bg-[#eee5f2] px-6 py-9 sm:px-10 sm:py-12 lg:order-1 lg:px-16 lg:py-12">
            <p className="text-xs font-semibold tracking-[0.16em] text-[#704576]">{hero.eyebrow}</p>
            <h1 className="mt-5 max-w-[620px] font-serif text-[3.35rem] leading-[.93] tracking-[-.055em] sm:text-7xl lg:text-[4.8rem] xl:text-[5rem]">
              {hero.title.split('\n').map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}
            </h1>
            <p className="mt-6 max-w-md text-[15px] leading-7 text-[#393720] sm:text-base">
              {hero.description}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link href={hero.buttonHref} className="ui-button ui-button--primary">
                {hero.buttonLabel}
              </Link>
              <span className="text-xs font-medium text-[#615364]">Free shipping on ${shippingSettings.freeShippingThreshold}+ after discounts</span>
            </div>
            <div className="mt-10 hidden items-center gap-3 text-xs font-semibold text-[#704576] sm:flex">
              <span className="h-px w-10 bg-[#704576]" />
              Made to match your mood
            </div>
          </div>

          <div className="relative order-1 aspect-square overflow-hidden bg-[#eee5f2] sm:aspect-[4/3] lg:order-2 lg:aspect-auto lg:min-h-[600px] xl:min-h-[640px]">
            {heroImage ? (
              <div className="absolute inset-0 block">
              <SafeImage
                unoptimized
                src={heroImage}
                alt={heroAlt}
                fill
                sizes="(max-width: 1023px) 100vw, (max-width: 1280px) 50vw, 640px"
                className="object-cover object-[center_24%] lg:object-[center_28%]"
                priority
              />
              </div>
            ) : (
              <div className="absolute inset-0 bg-[#eee5f2]" />
            )}
            <span className="absolute bottom-4 right-4 bg-[#fbf8f5] px-3 py-2 text-[10px] font-semibold tracking-[.08em] text-[#291b2d] sm:bottom-6 sm:right-6 sm:px-4 sm:py-3 sm:text-xs">{hero.badge}</span>
          </div>
        </div>
      </section>

      <section aria-label="Why Ginny Nana" className="border-b border-[#e9e5d9] py-5">
        <div className="storefront-container flex flex-wrap justify-center gap-x-8 gap-y-2 text-center text-[11px] font-semibold tracking-[.08em] sm:justify-between sm:text-xs">
          <span>HANDMADE WITH CARE</span>
          <span>REUSABLE BY DESIGN</span>
          <span>READY IN MINUTES</span>
          <span>FREE SHIPPING ON ${shippingSettings.freeShippingThreshold}+ AFTER DISCOUNTS</span>
        </div>
      </section>

      <section className="overflow-hidden bg-[#f1eaf2] py-16 md:py-20">
        <div className="storefront-container">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[.12em] text-[#704576]">THE GINNY NANA EDIT · 01—04</p>
              <h2 className="mt-2 font-serif text-4xl tracking-[-.04em] sm:text-5xl">Fresh off the nail desk</h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-[#615364]">Hand-finished sets made to turn a small detail into your whole look.</p>
            </div>
            <Link href="/all-products" className="hidden shrink-0 border-b border-[#a55a9c] pb-1 text-sm font-semibold hover:text-[#704576] sm:inline">Shop all ↗</Link>
          </div>
          {visibleProducts.length ? (
            <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5 [scrollbar-color:#a55a9c_#e4d8e8] [scrollbar-width:thin] lg:gap-6" role="region" aria-label="Featured nail sets" tabIndex={0}>
              {visibleProducts.slice(0, 8).map((product, index) => {
                const price = getPriceDetails(product)
                return <Link key={product._id} href={'/product/' + (product.slug || product._id)} className="store-product-card group relative w-[78vw] max-w-[360px] shrink-0 snap-start sm:w-[43vw] lg:w-[calc((100%-3rem)/3)]">
                  <div className="store-product-card__media">
                    <SafeImage unoptimized src={product.image?.[0] || '/media/ginny-nana-press-on-nails-test1-01.webp'} alt={product.imageAlt?.[0] || product.name} fill sizes="(max-width: 640px) 78vw, (max-width: 1024px) 43vw, 30vw" className="store-product-card__image" />
                    <span className="store-product-card__badge">{isStorefrontNew(product) ? 'New' : `Set Nº 0${index + 1}`}</span>
                    {price.onSale && <span className="store-product-card__badge store-product-card__badge--sale">On sale</span>}
                    <span aria-hidden="true" className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-[#fbf8f5] text-xl text-[#704576] transition-transform group-hover:translate-x-1">↗</span>
                  </div>
                  <div className="store-product-card__details">
                    <div className="store-product-card__copy"><h3 className="store-product-card__name">{product.name}</h3><p className="store-product-card__meta">Handmade press-on set</p></div>
                    <div className="store-product-card__price">{currency || '$'}{Number(price.currentPrice).toFixed(2)}{price.onSale && <s>{currency || '$'}{Number(price.price).toFixed(2)}</s>}</div>
                  </div>
                </Link>
              })}
            </div>
          ) : productsStatus === 'loading' ? (
              <div className="mt-8 bg-[#eee5f2] py-12 text-center text-sm text-[#615364]" role="status">Loading designs…</div>
          ) : productsStatus === 'error' ? (
            <div className="mt-8 bg-[#eee5f2] py-12 text-center text-sm text-[#615364]" role="alert">
              <p>We couldn’t load the collection.</p>
              <button type="button" onClick={fetchProductData} className="mt-3 underline underline-offset-4">Try again</button>
            </div>
          ) : (
            <div className="mt-8 bg-[#eee5f2] py-12 text-center text-sm text-[#615364]">New designs are on the way. Check back soon.</div>
          )}
          <Link href="/all-products" className="mt-2 inline-flex border-b border-[#a55a9c] pb-1 text-sm font-semibold sm:hidden">Shop all sets ↗</Link>
        </div>
      </section>

      {colorOptions.length > 0 && <section className="bg-[#fbf8f5] py-12">
        <div className="storefront-container">
          <p className="text-xs font-semibold tracking-[.12em] text-[#704576]">FIND YOUR SHADE</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div><h2 className="font-serif text-3xl tracking-[-.04em] sm:text-4xl">Shop by color</h2><p className="mt-2 text-sm text-[#615364]">Browse designs in the shades you love.</p></div>
            <nav aria-label="Shop by color" className="flex flex-wrap gap-2">
              {colorOptions.map(({ color, count }) => <Link key={color} href={`/all-products?color=${encodeURIComponent(color)}`} className="store-color-chip">{color}<span className="text-[#897b8d]">{count}</span></Link>)}
            </nav>
          </div>
        </div>
      </section>}

      <section className="pb-16 lg:pb-20">
        <div className="storefront-container grid gap-3 md:grid-cols-2">
          <Link href="/by-shape" className="category-card category-card--shape group relative isolate flex min-h-[240px] flex-col justify-between overflow-hidden p-7 text-white transition-colors sm:min-h-[300px] sm:p-10">
            <NailMotif className="pointer-events-none absolute right-5 top-5 h-24 w-32 text-[#e8d9ef] sm:right-8 sm:top-7" />
            <span className="text-xs font-semibold tracking-[.14em] text-[#e8d9ef]">FIND YOUR SHAPE</span>
            <span className="flex items-end justify-between gap-4">
              <span className="font-serif text-4xl leading-none tracking-[-.04em] sm:text-6xl">Almond, oval<br />or square?</span>
              <span aria-hidden="true" className="text-3xl transition-transform group-hover:translate-x-1">↗</span>
            </span>
          </Link>
          <Link href="/by-length" className="category-card category-card--length group relative isolate flex min-h-[240px] flex-col justify-between overflow-hidden p-7 text-white transition-colors sm:min-h-[300px] sm:p-10">
            <NailMotif variant="length" className="pointer-events-none absolute right-5 top-5 h-24 w-32 text-[#e8d9ef] sm:right-8 sm:top-7" />
            <span className="text-xs font-semibold tracking-[.14em] text-[#f7e8f4]">PICK YOUR LENGTH</span>
            <span className="flex items-end justify-between gap-4">
              <span className="font-serif text-4xl leading-none tracking-[-.04em] sm:text-6xl">Short and sweet<br />or full drama?</span>
              <span aria-hidden="true" className="text-3xl transition-transform group-hover:translate-x-1">↗</span>
            </span>
          </Link>
        </div>
      </section>

      <section className="bg-[#291b2d] py-16 text-[#fbf8f5] md:py-20">
        <div className="storefront-container">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[.14em] text-[#d9c9e5]">GOOD NAILS, NO APPOINTMENT</p>
            <h2 className="mt-3 font-serif text-4xl tracking-[-.04em] sm:text-5xl">Your manicure, your moment.</h2>
          </div>
          <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
            {values.map(([title, description]) => (
              <div className="border-t border-white/25 pt-4" key={title}>
                <h3 className="font-semibold text-[#d9c9e5]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {homepageSettings.mysteryBox?.enabled && <section className="bg-[#fbf8f5] py-14 md:py-16">
        <div className="storefront-container">
          <div className="storefront-card mystery-box-banner relative isolate grid min-h-[340px] bg-[#291b2d] sm:min-h-[420px] lg:grid-cols-2">
            {homepageSettings.mysteryBox.image && <span className="relative col-start-1 row-start-1 block h-[240px] overflow-hidden sm:h-[300px] lg:col-start-2 lg:row-start-1 lg:h-full lg:min-h-[420px]">
              <SafeImage unoptimized src={homepageSettings.mysteryBox.image} alt={homepageSettings.mysteryBox.alt} fill sizes="(max-width: 1023px) 100vw, 50vw" className="object-cover" />
            </span>}
            <span className="relative flex max-w-xl flex-col justify-center p-7 text-[#fbf8f5] sm:p-10 lg:col-start-1 lg:row-start-1 lg:p-14">
              <span className="text-xs font-semibold uppercase tracking-[.16em] text-[#e5c8df]">{homepageSettings.mysteryBox.eyebrow}</span>
              <span className="mt-4 font-serif text-4xl leading-tight tracking-[-.04em] sm:text-6xl">{homepageSettings.mysteryBox.title}</span>
              <span className="mt-4 max-w-md text-sm leading-6 text-white/80 sm:text-base">{homepageSettings.mysteryBox.description}</span>
            </span>
          </div>
        </div>
      </section>}
      <NewsletterSignup />
      <Footer />
    </main>
  )
}
