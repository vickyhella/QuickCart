"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import CartDrawer from "@/components/CartDrawer";

const Navbar = () => {
    const { products, getCartCount } = useAppContext();
    const [cartOpen, setCartOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    useEffect(() => {
        if (searchOpen) document.getElementById('site-search-input')?.focus();
    }, [searchOpen]);
    const lengthOrder = ["x-short", "short", "medium", "long", "x-long"];
    const shapeOrder = ["square", "oval", "almond", "round"];
    const lengths = [
        ...new Set([
            ...lengthOrder,
            ...products.flatMap((product) =>
                [
                    String(product.length || "")
                        .split(",")
                        .map((item) => item.trim()),
                    ...(product.variants || []).map(
                        (variant) => variant.length,
                    ),
                ]
                    .flat()
                    .filter(Boolean),
            ),
        ]),
    ].sort(
        (a, b) =>
            (lengthOrder.indexOf(a) < 0 ? 100 : lengthOrder.indexOf(a)) -
                (lengthOrder.indexOf(b) < 0 ? 100 : lengthOrder.indexOf(b)) ||
            a.localeCompare(b),
    );
    const shapes = [
        ...new Set([
            ...shapeOrder,
            ...products.flatMap((product) =>
                [
                    String(product.shape || "")
                        .split(",")
                        .map((item) => item.trim()),
                    ...(product.variants || []).map((variant) => variant.shape),
                ]
                    .flat()
                    .filter(Boolean),
            ),
        ]),
    ].sort(
        (a, b) =>
            (shapeOrder.indexOf(a) < 0 ? 100 : shapeOrder.indexOf(a)) -
                (shapeOrder.indexOf(b) < 0 ? 100 : shapeOrder.indexOf(b)) ||
            a.localeCompare(b),
    );
    const label = (value) =>
        value
            .replaceAll("-", " ")
            .replace(/\b\w/g, (letter) => letter.toUpperCase());

    return (
        <>
            <div className="bg-[#261a22] py-2 text-center text-[10px] uppercase tracking-[0.2em] text-[#fff8f7]">
                Free shipping on orders over $50
            </div>
            <nav className="relative z-40 flex items-center justify-between gap-5 border-b border-[#eadfdb] bg-[#fffdfa]/95 px-4 py-4 text-[#302522] shadow-[0_5px_30px_rgba(48,27,38,.04)] backdrop-blur sm:px-5 md:px-12 lg:px-16">
                <Link
                    href="/"
                    className="shrink-0 font-serif text-[1.65rem] tracking-[.06em]"
                >
                    Ginny <span className="italic text-[#985c70]">Nana</span>
                </Link>
                <div className="hidden items-center gap-7 pl-5 text-[13px] tracking-[.03em] lg:flex xl:gap-9">
                    <Link href="/all-products" className="hover:text-[#8b5e56]">
                        All Products
                    </Link>
                    <div className="relative group h-full py-2">
                        <Link
                            href="/by-length"
                            className="hover:text-[#8b5e56]"
                        >
                            By Length
                        </Link>
                        <div className="absolute left-0 top-full hidden min-w-48 rounded-lg border border-[#eadfd9] bg-white p-2 shadow-xl group-hover:block group-focus-within:block">
                            {lengths.map((length) => (
                                <Link
                                    key={length}
                                    href={`/by-length?length=${encodeURIComponent(length)}`}
                                    className="block rounded-md px-3 py-2 capitalize hover:bg-[#f8f3ef]"
                                >
                                    {label(length)}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="relative group h-full py-2">
                        <Link href="/by-shape" className="hover:text-[#8b5e56]">
                            By Shape
                        </Link>
                        <div className="absolute left-0 top-full hidden min-w-48 rounded-lg border border-[#eadfd9] bg-white p-2 shadow-xl group-hover:block group-focus-within:block">
                            {shapes.map((shape) => (
                                <Link
                                    key={shape}
                                    href={`/by-shape?shape=${encodeURIComponent(shape)}`}
                                    className="block rounded-md px-3 py-2 capitalize hover:bg-[#f8f3ef]"
                                >
                                    {label(shape)}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <Link
                        href="/all-products?isNew=true"
                        className="hover:text-[#8b5e56]"
                    >
                        New Arrivals
                    </Link>
                    <Link
                        href="/all-products?sale=true"
                        className="hover:text-[#8b5e56]"
                    >
                        On Sale
                    </Link>
                </div>
                <div className="ml-auto flex items-center gap-3 text-sm">
                    <button type="button" aria-expanded={searchOpen} aria-controls="site-search" aria-label="Search products" onClick={() => setSearchOpen(!searchOpen)} className="rounded-full p-2 hover:text-[#985c70]">
                        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
                    </button>
                    {process.env.NODE_ENV === "development" && (
                        <Link
                            href="/admin"
                            className="hidden xl:inline border border-[#d8c9c1] rounded-full px-4 py-2 hover:bg-[#f8f3ef]"
                        >
                            Manage products
                        </Link>
                    )}
                    <Link
                        href="/my-orders"
                        className="hidden rounded-full border border-[#d8c9c1] px-4 py-2 transition hover:border-[#985c70] hover:text-[#985c70] sm:inline"
                    >
                        Order status
                    </Link>
                    <button type="button" onClick={() => setCartOpen(true)} aria-expanded={cartOpen} className="rounded-full border border-[#d8c9c1] px-4 py-2 transition hover:border-[#985c70] hover:text-[#985c70]">
                        Cart{getCartCount() > 0 ? ` (${getCartCount()})` : ""}
                    </button>
                </div>
                {searchOpen && <form id="site-search" action="/search" role="search" className="absolute left-0 right-0 top-full flex gap-2 border-b border-[#eadfdb] bg-[#fffdfa] px-4 py-4 sm:px-5 md:px-12 lg:px-16">
                    <label htmlFor="site-search-input" className="sr-only">Product name</label>
                    <input id="site-search-input" type="search" name="q" maxLength={160} required placeholder="Search by product name" className="min-w-0 flex-1 rounded-lg border border-[#d8c9c1] px-4 py-2" />
                    <button className="rounded-lg bg-[#754b43] px-5 py-2 text-white">Search</button>
                </form>}
            </nav>
            {cartOpen && <CartDrawer open onClose={() => setCartOpen(false)} />}
            <nav
                aria-label="Mobile navigation"
                className="flex gap-6 overflow-x-auto border-b border-[#eadfdb] bg-[#fffdfa] px-4 py-3 text-xs tracking-wide lg:hidden"
            >
                <Link href="/all-products" className="shrink-0">All Products</Link>
                <Link href="/by-length" className="shrink-0">By Length</Link>
                <Link href="/by-shape" className="shrink-0">By Shape</Link>
                <Link href="/all-products?isNew=true" className="shrink-0">New Arrivals</Link>
                <Link href="/all-products?sale=true" className="shrink-0">On Sale</Link>
                <Link href="/my-orders" className="shrink-0">Order Status</Link>
            </nav>
        </>
    );
};

export default Navbar;
