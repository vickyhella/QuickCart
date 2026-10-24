'use client'

import { useState } from 'react'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'

export default function OrderLookupPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const lookup = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setOrder(null)
    try {
      const response = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, email }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to find this order.')
      setOrder(result)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#fffdfa] text-[#302522]">
      <Navbar />
      <section className="max-w-2xl mx-auto px-5 py-14 md:py-20">
        <p className="text-xs uppercase tracking-[0.25em] text-[#9a756d]">Ginny Nana</p>
        <h1 className="font-serif text-4xl mt-2">Track your order</h1>
        <p className="text-sm text-[#6e5c55] mt-3">Enter the order number shown after payment and the email used at checkout.</p>
        <form onSubmit={lookup} className="grid gap-4 mt-8">
          <label className="text-sm">Order number
            <input required value={orderNumber} onChange={(event) => setOrderNumber(event.target.value.toUpperCase())} placeholder="GN-…" className="block w-full mt-2 rounded-lg border border-[#d8c9c1] px-3 py-3" />
          </label>
          <label className="text-sm">Email address
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="block w-full mt-2 rounded-lg border border-[#d8c9c1] px-3 py-3" />
          </label>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button disabled={busy} className="ui-button ui-button--primary">{busy ? 'Looking up…' : 'Find order'}</button>
        </form>
        {order && <section className="mt-9 rounded-xl border border-[#e8ded8] p-5">
          <h2 className="font-serif text-2xl">Order {order.orderNumber}</h2>
          <p className="text-xs text-[#827873] mt-1">Placed {new Date(order.createdAt).toLocaleDateString()}</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-5 text-sm">
            <p>Payment: <strong className="capitalize">{order.paymentStatus}</strong></p>
            <p>Fulfillment: <strong className="capitalize">{order.fulfillmentStatus}</strong></p>
            {(order.trackingNumber || order.trackingUrl) && <p className="sm:col-span-2">{order.trackingNumber && <>Tracking number: <strong>{order.trackingNumber}</strong></>}{order.trackingNumber && order.trackingUrl && ' · '}{order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="underline">Track shipment</a>}</p>}
          </div>
          <ul className="border-t border-[#e8ded8] mt-5 pt-4 space-y-2 text-sm">
            {order.items.map((item, index) => <li key={`${item.title}-${index}`}>{item.title}{item.variant ? ` — ${item.variant}` : ''} × {item.quantity}</li>)}
          </ul>
        </section>}
      </section>
      <Footer />
    </main>
  )
}
