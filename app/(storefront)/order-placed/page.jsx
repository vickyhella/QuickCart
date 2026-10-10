'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import { useAppContext } from '@/context/AppContext'

export default function OrderPlaced() {
  const [orderNumber, setOrderNumber] = useState('')
  const { setCartItems } = useAppContext()

  useEffect(() => {
    const currentOrderNumber = new URLSearchParams(window.location.search).get('orderNumber') || ''
    setOrderNumber(currentOrderNumber)
    if (currentOrderNumber) setCartItems({})
  }, [setCartItems])

  return (
    <main className="min-h-screen bg-[#fffdfa] text-[#302522]">
      <Navbar />
      <section className="px-5 py-24 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-3xl">✓</div>
        <h1 className="font-serif text-4xl mt-6">Payment confirmed</h1>
        <p className="text-[#6e5c55] mt-3">Thank you for your order. PayPal confirmed your payment.</p>
        {orderNumber && <p className="mt-4 text-sm">Order number: <strong>{orderNumber}</strong></p>}
        <Link href="/all-products" className="inline-block mt-8 rounded-full bg-[#754b43] text-white px-7 py-3">Continue shopping</Link>
      </section>
      <Footer />
    </main>
  )
}
