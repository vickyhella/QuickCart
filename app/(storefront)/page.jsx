'use client'

import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import ProductCard from '@/components/ProductCard'
import NewsletterSignup from '@/components/NewsletterSignup'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useAppContext } from '@/context/AppContext'
import { getProductColor } from '@/lib/product-color'
import { selectHomepageProducts } from '@/lib/homepage-products'
import categoryImages from '@/config/category-images.json'
import contentSources from '@/config/content-sources.json'

const guides = [
  { title: 'Find your size', description: 'Measure once, then compare with our size chart.', href: '/size-guide/' },
  { title: 'See what’s in the set', description: 'Get to know your adhesive and prep accessories.', href: '/what-you-will-get/' },
  { title: 'Learn how to apply', description: 'Follow our four-step photo guide, at your own pace.', href: '/how-to-apply/' },
]

export default function Home() {
  const { products, productsStatus, fetchProductData, shippingSettings, shippingEstimate, homepageSettings, storefrontNavigation, siteSettings } = useAppContext()
  const selection = selectHomepageProducts(products, homepageSettings.featured.productKeys)
  const colorOptions = Array.from(products.reduce((counts, product) => {
    const color = getProductColor(product)
    if (color) counts.set(color, (counts.get(color) || 0) + 1)
    return counts
  }, new Map()), ([color, count]) => ({ color, count })).sort((a, b) => b.count - a.count || a.color.localeCompare(b.color)).slice(0, 6)
  const lengths = homepageSettings.discovery.lengths.map((item) => {
    const configured = storefrontNavigation.lengths.find((option) => option.value === item.value)
    const image = contentSources.categoryImages === 'repository'
      ? categoryImages.lengths[item.value]
      : configured?.image && { image: configured.image.url, alt: configured.image.alt || item.label + ' press-on nails' }
    return { ...item, image }
  }).filter((item) => item.image?.image)
  const hero = homepageSettings.hero
  const craft = homepageSettings.craft
  const faqs = [
    { question: 'How do I choose my size?', answer: <>Measure the widest part of each natural nail on both hands, then compare with our <Link href="/size-guide/">size chart and photo guide</Link>. You can also find the chart on every product page.</> },
    { question: 'What comes with my set?', answer: <>Our set guide lists jelly adhesive pieces, nail glue, alcohol pads, remover and prep tools. See <Link href="/what-you-will-get/">the full contents and quantities</Link>, and check any design-specific information on the product page.</> },
    { question: 'Can I wear my nails again?', answer: <>With careful removal and proper care, you can keep your press-ons to wear again. Follow your adhesive’s removal instructions and never force a nail off. Start with our <Link href="/how-to-apply/">application guide</Link>.</> },
    { question: 'When will my order arrive?', answer: <>Delivery is {shippingEstimate}. Orders of {'$'}{shippingSettings.freeShippingThreshold}+ after discounts qualify for free shipping. See <Link href="/shipping-policy/">shipping destinations, rates and preparation times</Link> before ordering.</> },
  ]

  return (
    <main className="min-h-screen bg-[var(--store-surface)] text-[var(--store-ink)]">
      <Navbar />
      <section aria-label="Handmade press-on nails">
        <div className="storefront-container storefront-card grid bg-[var(--store-lavender)] lg:min-h-[580px] lg:grid-cols-2 xl:min-h-[620px]">
          <div className="order-2 flex flex-col justify-center px-6 py-5 sm:px-10 sm:py-10 lg:order-1 lg:px-14 lg:py-12">
            <p className="text-xs font-semibold tracking-[.12em] text-[var(--store-accent)]">{hero.eyebrow}</p>
            <h1 className="mt-3 max-w-[620px] font-serif text-[2.85rem] leading-[.98] tracking-[-.05em] sm:mt-5 sm:text-6xl lg:text-[4.6rem] xl:text-[5rem]">
              {hero.title.split('\n').map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-6 text-[var(--store-muted)] sm:mt-6 sm:text-base sm:leading-7">{hero.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-4 sm:mt-7"><Link href={hero.buttonHref} className="ui-button ui-button--primary">{hero.buttonLabel}</Link></div>
            <a href="#first-set" className="mt-4 inline-flex min-h-10 w-fit items-center text-sm font-medium text-[var(--store-accent)] underline underline-offset-4">New to press-ons? Start here</a>
          </div>
          <div className="relative order-1 aspect-[2/1] overflow-hidden bg-[var(--store-lavender)] sm:aspect-[4/3] lg:order-2 lg:aspect-auto lg:min-h-[580px] xl:min-h-[620px]">
            {hero.image && <SafeImage unoptimized src={hero.image} alt={hero.alt} fill sizes="(max-width: 1023px) 100vw, 50vw" className="object-cover object-[center_55%] lg:object-[center_28%]" priority />}
            {hero.badge && <span className="absolute bottom-6 right-6 hidden bg-[var(--store-surface)] px-4 py-3 text-xs font-semibold sm:block">{hero.badge}</span>}
          </div>
        </div>
      </section>

      <nav aria-label="Shopping help" className="storefront-container flex flex-wrap items-center justify-center gap-x-7 gap-y-1 py-4 text-sm text-[var(--store-muted)] sm:justify-between">
        <Link className="inline-flex min-h-10 items-center hover:underline" href="/about-us/">Handmade with care</Link>
        <Link className="inline-flex min-h-10 items-center hover:underline" href="/size-guide/">Find your fit</Link>
        <Link className="inline-flex min-h-10 items-center hover:underline" href="/what-you-will-get/">See what’s included</Link>
      </nav>

      <section aria-labelledby="length-heading" className="py-9 sm:py-12">
        <div className="storefront-container">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><h2 id="length-heading" className="font-serif text-3xl tracking-[-.03em] sm:text-4xl">Start with your length.</h2><p className="mt-2 text-sm leading-6 text-[var(--store-muted)]">Find the look that fits your day.</p></div>
            <Link href="/by-shape/" className="inline-flex min-h-10 items-center text-sm font-medium text-[var(--store-accent)] underline underline-offset-4">Prefer to shop by shape?</Link>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 sm:mt-7 sm:gap-6">
            {lengths.map((item) => <Link key={item.value} href={'/by-length?length=' + encodeURIComponent(item.value)} className="group min-w-0 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--store-accent)]">
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-[var(--store-lavender)] sm:aspect-[4/3]"><SafeImage src={item.image.image} alt={item.image.alt} fill sizes="(max-width: 639px) 30vw, (max-width: 1023px) 31vw, 380px" className="object-cover object-[center_65%] transition-transform duration-500 group-hover:scale-[1.03]" /></div>
              <h3 className="mt-3 flex items-center justify-between gap-1 font-serif text-xl sm:text-3xl">{item.label}<span aria-hidden="true" className="text-base text-[var(--store-accent)]">↗</span></h3>
              <p className="mt-1 hidden text-sm text-[var(--store-muted)] sm:block">{item.description}</p>
            </Link>)}
          </div>
          {colorOptions.length > 0 && <nav aria-label="Shop by color" className="mt-6 flex flex-wrap items-center gap-2 text-sm"><span className="mr-2 text-[var(--store-muted)]">Or find your shade</span>{colorOptions.map(({ color, count }) => <Link key={color} href={'/all-products?color=' + encodeURIComponent(color)} className="store-color-chip">{color}<span className="text-[var(--store-muted)]">{count}</span></Link>)}</nav>}
        </div>
      </section>

      <section aria-labelledby="collection-heading" className="bg-[var(--store-lavender-soft)] py-12 sm:py-16">
        <div className="storefront-container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><h2 id="collection-heading" className="font-serif text-3xl tracking-[-.03em] sm:text-4xl">{selection.curated ? homepageSettings.featured.title : 'Explore our nail sets.'}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[var(--store-muted)]">{selection.curated ? homepageSettings.featured.description : 'Take a closer look at the designs, lengths and finishes in the collection.'}</p></div>
            <Link href="/all-products" className="inline-flex min-h-10 items-center text-sm font-semibold text-[var(--store-accent)] underline underline-offset-4">Shop all designs ↗</Link>
          </div>
          {selection.products.length ? <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6">{selection.products.map((product) => <ProductCard key={product._id} product={product} />)}</div>
            : productsStatus === 'loading' ? <p className="py-12 text-center text-sm text-[var(--store-muted)]" role="status">Loading designs…</p>
              : productsStatus === 'error' ? <div className="py-12 text-center text-sm text-[var(--store-muted)]" role="alert"><p>We couldn’t load the collection.</p><button type="button" onClick={fetchProductData} className="mt-3 min-h-10 underline underline-offset-4">Try again</button></div>
                : <p className="py-12 text-center text-sm text-[var(--store-muted)]">New designs are on the way. Check back soon.</p>}
        </div>
      </section>

      <section id="first-set" aria-labelledby="first-set-heading" className="scroll-mt-6 py-12 sm:py-16">
        <div className="storefront-container grid items-center gap-7 lg:grid-cols-2 lg:gap-14">
          <div>
            <h2 id="first-set-heading" className="font-serif text-3xl tracking-[-.03em] sm:text-4xl">First set? Start here.</h2>
            <p className="mt-3 max-w-lg text-base leading-7 text-[var(--store-muted)]">A little guidance makes all the difference. Get comfortable with the fit, the kit and the application before you choose.</p>
            <div className="mt-5 divide-y divide-[var(--store-border)]">{guides.map((guide) => <Link key={guide.href} href={guide.href} className="group flex items-center justify-between gap-4 py-4 text-[var(--store-accent)]"><span><h3 className="text-base font-semibold group-hover:underline">{guide.title}</h3><p className="mt-1 text-sm leading-6 text-[var(--store-muted)]">{guide.description}</p></span><span aria-hidden="true" className="text-xl">↗</span></Link>)}</div>
          </div>
          <div className="overflow-hidden rounded-xl bg-[var(--store-lavender-soft)]"><SafeImage src="/site/guides/photos/application.jpg" alt="Illustrative photos showing nail preparation, fitting, adhesive and pressing a nail into place" width={1536} height={1024} sizes="(max-width: 1023px) 90vw, 45vw" className="h-auto w-full" /></div>
        </div>
      </section>

      <section aria-labelledby="details-heading" className="bg-[var(--store-ink)] py-12 text-[var(--gn-ivory)] sm:py-16">
        <div className="storefront-container grid items-center gap-7 md:grid-cols-[.9fr_1.1fr] md:gap-12">
          <figure className="min-w-0"><div className="relative aspect-[4/3] overflow-hidden rounded-xl md:aspect-square"><SafeImage src={craft.image} alt={craft.alt} fill sizes="(max-width: 767px) 90vw, 40vw" className="object-cover object-[center_65%]" /></div><figcaption className="mt-3 text-sm text-white/70">A closer look at a Ginny Nana design.</figcaption></figure>
          <div>
            <h2 id="details-heading" className="max-w-lg font-serif text-3xl tracking-[-.03em] sm:text-4xl">{craft.title}</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/80">{craft.description}</p>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/80">Because each set is handmade, small variations in colour and detail are part of its character. Choose your fit with care, then enjoy a design that feels personal.</p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold"><Link href="/about-us/" className="inline-flex min-h-10 items-center underline underline-offset-4">Meet Ginny Nana</Link><Link href="/what-you-will-get/" className="inline-flex min-h-10 items-center underline underline-offset-4">Explore your nail kit</Link></div>
            <p className="mt-5 text-sm leading-6 text-white/70">Unsure about sizing? <a href={'mailto:' + siteSettings.customerEmail} className="underline underline-offset-4">Ask us before ordering.</a></p>
          </div>
        </div>
      </section>

      {homepageSettings.mysteryBox?.enabled && <section className="py-12 sm:py-16"><div className="storefront-container storefront-card grid bg-[var(--store-lavender)] lg:grid-cols-2">
        {homepageSettings.mysteryBox.image && <SafeImage src={homepageSettings.mysteryBox.image} alt={homepageSettings.mysteryBox.alt} width={800} height={600} className="h-full w-full object-cover" />}
        <div className="flex flex-col justify-center p-7 sm:p-10"><p className="text-sm text-[var(--store-accent)]">{homepageSettings.mysteryBox.eyebrow}</p><h2 className="mt-3 font-serif text-3xl sm:text-4xl">{homepageSettings.mysteryBox.title}</h2><p className="mt-4 text-base leading-7 text-[var(--store-muted)]">{homepageSettings.mysteryBox.description}</p></div>
      </div></section>}

      <section aria-labelledby="faq-heading" className="py-12 sm:py-16">
        <div className="storefront-container grid gap-5 lg:grid-cols-[.65fr_1fr] lg:gap-14">
          <div><h2 id="faq-heading" className="font-serif text-3xl tracking-[-.03em] sm:text-4xl">A few good questions.</h2><p className="mt-3 max-w-sm text-base leading-7 text-[var(--store-muted)]">The practical details, before you fall for your next set.</p><Link href="/all-products" className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-[var(--store-accent)] underline underline-offset-4">Ready to find your set?</Link></div>
          <div className="divide-y divide-[var(--store-border)]">{faqs.map((faq) => <details key={faq.question} className="group py-4 first:pt-0"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold [&::-webkit-details-marker]:hidden">{faq.question}<span aria-hidden="true" className="text-xl font-normal text-[var(--store-accent)] group-open:rotate-45">+</span></summary><div className="pb-2 pt-3 text-base leading-7 text-[var(--store-muted)] [&_a]:text-[var(--store-accent)] [&_a]:underline [&_a]:underline-offset-4">{faq.answer}</div></details>)}</div>
        </div>
      </section>

      <NewsletterSignup />
      <Footer />
    </main>
  )
}
