"use client";
import Link from "next/link";
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import CartDrawer from "@/components/CartDrawer";

const CatalogNavigation = ({ pathname, products, storefrontNavigation, storefrontNavigationStatus }) => {
    const searchParams = useSearchParams();
    const currentPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
    const lengthOrder = ["x-short", "short", "medium", "long", "x-long"];
    const shapeOrder = ["square", "oval", "almond", "round"];
    const options = (configured, values, order) => configured.length ? configured.map((item) => item.value) : [...new Set([...order, ...values])].filter(Boolean).sort((a, b) => (order.indexOf(a) < 0 ? 100 : order.indexOf(a)) - (order.indexOf(b) < 0 ? 100 : order.indexOf(b)) || a.localeCompare(b));
    const lengths = options(storefrontNavigation.lengths, products.flatMap((product) => [String(product.length || "").split(",").map((item) => item.trim()), ...(product.variants || []).map((variant) => variant.length)].flat()), lengthOrder);
    const shapes = options(storefrontNavigation.shapes, products.flatMap((product) => [String(product.shape || "").split(",").map((item) => item.trim()), ...(product.variants || []).map((variant) => variant.shape)].flat()), shapeOrder);
    const pages = storefrontNavigation.pages.filter((page) => page.placement === 'navigation');
    const isNavigationPage = (page) => currentPath === `/${page.slug}`;
    const howToUseActive = pages.some(isNavigationPage);
    const sale = searchParams.get('sale') === 'true';
    const isNew = searchParams.get('isNew') === 'true';
    const active = (selected) => 'inline-flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-full px-2.5 transition-colors ' + (selected ? 'bg-[#f4edf5] font-semibold text-[#704576] ring-1 ring-inset ring-[#e5d8e9]' : 'hover:bg-[#f4edf5] hover:text-[#704576]');
    const mobileActive = (selected) => 'inline-flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-full px-3 transition-colors ' + (selected ? 'bg-[#f4edf5] font-semibold text-[#704576] ring-1 ring-inset ring-[#e5d8e9]' : 'hover:bg-[#f4edf5] hover:text-[#704576]');
    const filter = (key) => searchParams.get(key);
    const label = (value) => value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
    return <>
        <nav aria-label="Primary navigation" className="order-2 hidden min-w-0 items-center gap-1 pl-2 text-xs tracking-[.01em] lg:flex xl:gap-2 xl:text-[13px]">
            <Link href="/all-products" aria-current={currentPath === '/all-products' && !sale && !isNew ? 'page' : undefined} className={active(currentPath === '/all-products' && !sale && !isNew)}>All Products</Link>
            <div className="group relative py-2"><Link href="/by-length" aria-current={currentPath === '/by-length' ? 'page' : undefined} className={active(currentPath === '/by-length')}>By Length</Link><div className="absolute left-0 top-full z-50 hidden min-w-48 rounded-lg border border-[#eadfdb] bg-white p-2 shadow-xl group-hover:block group-focus-within:block">{lengths.map((item) => { const selected = currentPath === '/by-length' && filter('length') === item; return <Link key={item} href={`/by-length?length=${encodeURIComponent(item)}`} aria-current={selected ? 'page' : undefined} className={'block rounded-md px-3 py-2 capitalize ' + (selected ? 'bg-[#f4edf5] font-semibold text-[#704576]' : 'hover:bg-[#f4edf5]')}>{label(item)}</Link> })}</div></div>
            <div className="group relative py-2"><Link href="/by-shape" aria-current={currentPath === '/by-shape' ? 'page' : undefined} className={active(currentPath === '/by-shape')}>By Shape</Link><div className="absolute left-0 top-full z-50 hidden min-w-48 rounded-lg border border-[#eadfdb] bg-white p-2 shadow-xl group-hover:block group-focus-within:block">{shapes.map((item) => { const selected = currentPath === '/by-shape' && filter('shape') === item; return <Link key={item} href={`/by-shape?shape=${encodeURIComponent(item)}`} aria-current={selected ? 'page' : undefined} className={'block rounded-md px-3 py-2 capitalize ' + (selected ? 'bg-[#f4edf5] font-semibold text-[#704576]' : 'hover:bg-[#f4edf5]')}>{label(item)}</Link> })}</div></div>
            <Link href="/all-products?isNew=true" aria-current={currentPath === '/all-products' && isNew ? 'page' : undefined} className={active(currentPath === '/all-products' && isNew)}>New Arrivals</Link>
            <Link href="/all-products?sale=true" aria-current={currentPath === '/all-products' && sale ? 'page' : undefined} className={active(currentPath === '/all-products' && sale)}>On Sale</Link>
            {pages.length ? <div className="group relative py-2"><button type="button" className={active(howToUseActive)}>How to Use</button><div className="absolute left-0 top-full z-50 hidden min-w-48 rounded-lg border border-[#eadfdb] bg-white p-2 shadow-xl group-hover:block group-focus-within:block">{pages.map((page) => <Link key={page.slug} href={`/${page.slug}/`} aria-current={isNavigationPage(page) ? 'page' : undefined} className={'block rounded-md px-3 py-2 ' + (isNavigationPage(page) ? 'bg-[#f4edf5] font-semibold text-[#704576]' : 'hover:bg-[#f4edf5]')}>{page.title}</Link>)}</div></div> : storefrontNavigationStatus === 'loading' && <span className={active(false)}>How to Use</span>}
        </nav>
        <nav aria-label="Mobile navigation" className="order-2 flex w-full min-w-0 flex-nowrap items-center gap-1 overflow-x-auto border-t border-[#eadfdb] pt-1 text-xs tracking-wide lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link href="/all-products" aria-current={currentPath === '/all-products' && !sale && !isNew ? 'page' : undefined} className={mobileActive(currentPath === '/all-products' && !sale && !isNew)}>All Products</Link>
            <Link href="/by-length" aria-current={currentPath === '/by-length' ? 'page' : undefined} className={mobileActive(currentPath === '/by-length')}>By Length</Link>
            <Link href="/by-shape" aria-current={currentPath === '/by-shape' ? 'page' : undefined} className={mobileActive(currentPath === '/by-shape')}>By Shape</Link>
            <Link href="/all-products?isNew=true" aria-current={currentPath === '/all-products' && isNew ? 'page' : undefined} className={mobileActive(currentPath === '/all-products' && isNew)}>New Arrivals</Link>
            <Link href="/all-products?sale=true" aria-current={currentPath === '/all-products' && sale ? 'page' : undefined} className={mobileActive(currentPath === '/all-products' && sale)}>On Sale</Link>
            {pages.length ? <details className="group relative shrink-0"><summary className={'list-none [&::-webkit-details-marker]:hidden ' + mobileActive(howToUseActive)}>How to Use <span aria-hidden="true" className="ml-1 text-[10px]">⌄</span></summary><div className="absolute left-0 top-full z-50 mt-1 min-w-44 rounded-lg border border-[#eadfdb] bg-white p-2 shadow-xl">{pages.map((page) => <Link key={page.slug} href={`/${page.slug}/`} aria-current={isNavigationPage(page) ? 'page' : undefined} className={'block rounded-md px-3 py-2.5 ' + (isNavigationPage(page) ? 'bg-[#f4edf5] font-semibold text-[#704576]' : 'hover:bg-[#f4edf5]')}>{page.title}</Link>)}</div></details> : storefrontNavigationStatus === 'loading' && <span className={mobileActive(false)}>How to Use</span>}
            <Link href="/my-orders" aria-current={currentPath === '/my-orders' ? 'page' : undefined} className={mobileActive(currentPath === '/my-orders')}>Order Status</Link>
        </nav>
    </>;
};

const Navbar = () => {
    const { products, getCartCount, storefrontNavigation, storefrontNavigationStatus, shippingSettings, siteSettings } = useAppContext();
    const [cartOpen, setCartOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const pathname = usePathname();
    useEffect(() => {
        if (searchOpen) document.getElementById('site-search-input')?.focus();
    }, [searchOpen]);
    return (
        <>
            <div className="bg-[#261a22] py-2 text-center text-[10px] uppercase tracking-[0.2em] text-[#fff8f7]">
                Free shipping on orders ${shippingSettings.freeShippingThreshold}+ after discounts
            </div>
            <header className="relative z-40 flex flex-wrap items-center gap-x-3 border-b border-[#eadfdb] bg-[#fffdfa]/95 px-4 py-3 text-[#302522] shadow-[0_5px_30px_rgba(48,27,38,.04)] backdrop-blur sm:px-5 md:px-12 lg:flex-nowrap lg:gap-x-3 lg:px-8 xl:px-12">
                <div className="order-1 flex w-full items-center justify-between gap-3 lg:contents">
                    <Link href="/" aria-label="Ginny Nana home" className="shrink-0 lg:order-1">
                        <Image src={siteSettings.logo} alt={siteSettings.brandName} width={190} height={46} priority style={{ height: 'auto' }} className="h-auto w-[130px] min-[360px]:w-[142px] sm:w-[165px] lg:w-[175px] xl:w-[190px]" />
                    </Link>
                    <div className="ml-auto flex shrink-0 items-center gap-1 text-sm sm:gap-2 lg:order-3">
                        <Link href="/account" aria-label="Customer account" title="Your account" className="rounded-full p-2 hover:text-[#704576]">
                        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></svg>
                    </Link>
                    <button type="button" aria-expanded={searchOpen} aria-controls="site-search" aria-label="Search products" onClick={() => setSearchOpen(!searchOpen)} className="rounded-full p-2 hover:text-[#704576]">
                        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
                    </button>
                    {process.env.NODE_ENV === "development" && (
                        <Link
                            href="/admin"
                            className="ui-button ui-button--secondary hidden 2xl:inline-flex"
                        >
                            Manage products
                        </Link>
                    )}
                    <Link href="/my-orders" className="ui-button ui-button--secondary hidden lg:inline-flex">Order status</Link>
                    <button type="button" onClick={() => setCartOpen(true)} aria-expanded={cartOpen} className="ui-button ui-button--secondary">
                        Cart{getCartCount() > 0 ? ` (${getCartCount()})` : ""}
                    </button>
                </div>
                </div>
                <Suspense fallback={<><nav aria-label="Primary navigation" className="order-2 hidden min-w-0 items-center gap-1 text-xs lg:flex"><Link href="/all-products" className="whitespace-nowrap px-2">All Products</Link><Link href="/by-length" className="whitespace-nowrap px-2">By Length</Link><Link href="/by-shape" className="whitespace-nowrap px-2">By Shape</Link><Link href="/all-products?isNew=true" className="whitespace-nowrap px-2">New Arrivals</Link><Link href="/all-products?sale=true" className="whitespace-nowrap px-2">On Sale</Link><span className="whitespace-nowrap px-2">How to Use</span></nav><nav aria-label="Mobile navigation" className="order-2 flex w-full min-w-0 flex-nowrap items-center gap-1 overflow-x-auto border-t border-[#eadfdb] pt-1 text-xs lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><Link href="/all-products" className="shrink-0 whitespace-nowrap px-3 py-2">All Products</Link><Link href="/by-length" className="shrink-0 whitespace-nowrap px-3 py-2">By Length</Link><Link href="/by-shape" className="shrink-0 whitespace-nowrap px-3 py-2">By Shape</Link><Link href="/all-products?isNew=true" className="shrink-0 whitespace-nowrap px-3 py-2">New Arrivals</Link><Link href="/all-products?sale=true" className="shrink-0 whitespace-nowrap px-3 py-2">On Sale</Link><span className="shrink-0 whitespace-nowrap px-3 py-2">How to Use</span><Link href="/my-orders" className="shrink-0 whitespace-nowrap px-3 py-2">Order Status</Link></nav></>}>
                    <CatalogNavigation pathname={pathname} products={products} storefrontNavigation={storefrontNavigation} storefrontNavigationStatus={storefrontNavigationStatus} />
                </Suspense>
                {searchOpen && <form id="site-search" action="/search" role="search" className="absolute left-0 right-0 top-full flex gap-2 border-b border-[#eadfdb] bg-[#fffdfa] px-4 py-4 sm:px-5 md:px-12 lg:px-16">
                    <label htmlFor="site-search-input" className="sr-only">Product name</label>
                    <input id="site-search-input" type="search" name="q" maxLength={160} required placeholder="Search by product name" className="min-w-0 flex-1 rounded-lg border border-[#d8c9c1] px-4 py-2" />
                    <button className="ui-button ui-button--primary">Search</button>
                </form>}
            </header>
            {cartOpen && <CartDrawer open onClose={() => setCartOpen(false)} />}
        </>
    );
};

export default Navbar;
