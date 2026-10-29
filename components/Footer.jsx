'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAppContext } from '@/context/AppContext'
import { mergeRepositoryPages } from '@/lib/repository-pages'

export default function Footer() {
  const { storefrontNavigation, siteSettings } = useAppContext()
  const pages = mergeRepositoryPages(storefrontNavigation.pages)
  const explorePages = pages.filter((page) => page.placement === 'footer-explore')
  const carePages = pages.filter((page) => page.placement === 'footer-customer-care')
  return (
    <footer className="border-t border-[#3d2b36] bg-[#261a22] text-white/65">
      <div className="grid gap-10 md:grid-cols-3 px-5 md:px-12 lg:px-20 py-12">
        <div>
          <Link href="/" aria-label={`${siteSettings.brandName} home`}><Image src={siteSettings.footerLogo} alt={siteSettings.brandName} width={190} height={46} className="h-10 w-auto" /></Link>
          <p className="text-sm leading-6 mt-4 max-w-sm">{siteSettings.defaultSeo.description}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-white">Explore</h2>
          <div className="text-sm flex flex-col gap-3 mt-4">
            <Link href="/all-products">All products</Link>
            <Link href="/all-products?isNew=true">New arrivals</Link>
            <Link href="/all-products?sale=true">On sale</Link>
            {explorePages.map((page) => <Link key={page.slug} href={`/${page.slug}/`}>{page.title}</Link>)}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-medium text-white">Customer care</h2>
          <div className="text-sm flex flex-col gap-3 mt-4">
            {carePages.map((page) => <Link key={page.slug} href={`/${page.slug}/`}>{page.title}</Link>)}
            <a href={`mailto:${siteSettings.customerEmail}`}>{siteSettings.customerEmail}</a>
          </div>
        </div>
      </div>
      <p className="border-t border-white/10 px-5 py-4 text-center text-xs">© {new Date().getFullYear()} Ginny Nana</p>
    </footer>
  )
}
