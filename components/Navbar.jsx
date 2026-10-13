"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";

const Navbar = () => {
    const { products, getCartCount } = useAppContext();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mobileSection, setMobileSection] = useState("");
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
                    {process.env.NODE_ENV === "development" && (
                        <Link
                            href="/admin"
                            className="border border-[#d8c9c1] rounded-full px-4 py-2 hover:bg-[#f8f3ef]"
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
                    <Link
                        href="/cart"
                        className="rounded-full border border-[#d8c9c1] px-4 py-2 transition hover:border-[#985c70] hover:text-[#985c70]"
                    >
                        Cart{getCartCount() > 0 ? ` (${getCartCount()})` : ""}
                    </Link>
                    <button
                        type="button"
                        aria-expanded={mobileOpen}
                        aria-label={
                            mobileOpen
                                ? "Close navigation menu"
                                : "Open navigation menu"
                        }
                        className="rounded-full border border-[#d8c9c1] px-3 py-2 lg:hidden"
                        onClick={() => setMobileOpen((open) => !open)}
                    >
                        {mobileOpen ? "Close" : "Menu"}
                    </button>
                </div>
                {mobileOpen && (
                    <div className="absolute left-0 right-0 top-full max-h-[80vh] overflow-y-auto border-b border-[#eadfd9] bg-[#fffdfa] p-4 shadow-xl lg:hidden">
                        <div className="grid gap-1 text-sm">
                            <Link
                                href="/all-products"
                                onClick={() => setMobileOpen(false)}
                                className="rounded-md px-3 py-3 hover:bg-[#f8f3ef]"
                            >
                                All Products
                            </Link>
                            <section>
                                <button
                                    type="button"
                                    aria-expanded={mobileSection === "length"}
                                    onClick={() =>
                                        setMobileSection((section) =>
                                            section === "length"
                                                ? ""
                                                : "length",
                                        )
                                    }
                                    className="flex w-full items-center justify-between rounded-md px-3 py-3 text-left hover:bg-[#f8f3ef]"
                                >
                                    By Length{" "}
                                    <span>
                                        {mobileSection === "length" ? "−" : "+"}
                                    </span>
                                </button>
                                {mobileSection === "length" && (
                                    <div className="grid grid-cols-2 gap-1 pb-2 pl-3">
                                        {lengths.map((length) => (
                                            <Link
                                                key={length}
                                                href={`/by-length?length=${encodeURIComponent(length)}`}
                                                onClick={() =>
                                                    setMobileOpen(false)
                                                }
                                                className="rounded-md px-3 py-2 capitalize text-[#6e5c55] hover:bg-[#f8f3ef]"
                                            >
                                                {label(length)}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </section>
                            <section>
                                <button
                                    type="button"
                                    aria-expanded={mobileSection === "shape"}
                                    onClick={() =>
                                        setMobileSection((section) =>
                                            section === "shape" ? "" : "shape",
                                        )
                                    }
                                    className="flex w-full items-center justify-between rounded-md px-3 py-3 text-left hover:bg-[#f8f3ef]"
                                >
                                    By Shape{" "}
                                    <span>
                                        {mobileSection === "shape" ? "−" : "+"}
                                    </span>
                                </button>
                                {mobileSection === "shape" && (
                                    <div className="grid grid-cols-2 gap-1 pb-2 pl-3">
                                        {shapes.map((shape) => (
                                            <Link
                                                key={shape}
                                                href={`/by-shape?shape=${encodeURIComponent(shape)}`}
                                                onClick={() =>
                                                    setMobileOpen(false)
                                                }
                                                className="rounded-md px-3 py-2 capitalize text-[#6e5c55] hover:bg-[#f8f3ef]"
                                            >
                                                {label(shape)}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </section>
                            <Link
                                href="/all-products?isNew=true"
                                onClick={() => setMobileOpen(false)}
                                className="rounded-md px-3 py-3 hover:bg-[#f8f3ef]"
                            >
                                New Arrivals
                            </Link>
                            <Link
                                href="/all-products?sale=true"
                                onClick={() => setMobileOpen(false)}
                                className="rounded-md px-3 py-3 hover:bg-[#f8f3ef]"
                            >
                                On Sale
                            </Link>
                            <Link
                                href="/my-orders"
                                onClick={() => setMobileOpen(false)}
                                className="rounded-md px-3 py-3 hover:bg-[#f8f3ef]"
                            >
                                Order Status
                            </Link>
                        </div>
                    </div>
                )}
            </nav>
        </>
    );
};

export default Navbar;
