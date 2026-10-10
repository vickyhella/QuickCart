"use client"
import React from "react";
import Link from "next/link"
import { useAppContext } from "@/context/AppContext";

const Navbar = () => {

  const { router } = useAppContext();

  return (
    <>
      <div className="bg-[#754b43] text-white text-center py-2 text-[11px] tracking-[0.18em] uppercase">Free shipping on orders over $50</div>
      <nav className="flex items-center justify-between px-5 md:px-12 lg:px-20 py-4 border-b border-[#eee5df] bg-[#fffdfa] text-[#302522]">
        <Link href="/" className="font-serif text-2xl tracking-wide">ginny nana</Link>
        <div className="hidden md:flex items-center gap-7 text-sm">
          <Link href="/all-products" className="hover:text-[#8b5e56]">All Products</Link>
          <Link href="/by-length" className="hover:text-[#8b5e56]">By Length</Link>
          <Link href="/by-shape" className="hover:text-[#8b5e56]">By Shape</Link>
          <Link href="/all-products?isNew=true" className="hover:text-[#8b5e56]">New Arrivals</Link>
          <Link href="/all-products?sale=true" className="hover:text-[#8b5e56]">On Sale</Link>
          <Link href="/my-orders" className="hover:text-[#8b5e56]">Order status</Link>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {process.env.NODE_ENV === 'development' && <Link href="/admin" className="border border-[#d8c9c1] rounded-full px-4 py-2 hover:bg-[#f8f3ef]">Manage products</Link>}
          <Link href="/cart" className="hidden sm:inline">Cart</Link>
          <Link href="/my-orders" className="sm:hidden">Orders</Link>
        </div>
        <button className="md:hidden text-sm" onClick={() => router.push('/all-products')}>Shop</button>
      </nav>
    </>
  );
};

export default Navbar;
