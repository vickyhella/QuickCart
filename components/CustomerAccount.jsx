'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

function CustomerOrders({ page, onPageChange }) {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/customer/orders?page=${page}`, { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 401 ? 'Your session has expired. Refresh this page to sign in again.' : 'We couldn’t load your orders. Please refresh to try again.')
        return response.json()
      })
      .then(setResult)
      .catch((requestError) => { if (requestError.name !== 'AbortError') setError(requestError.message) })
    return () => controller.abort()
  }, [page])

  return <section className="mt-10 border-t border-[#eadfdb] pt-8">
    <h2 className="font-serif text-2xl">Your orders</h2>
    {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : !result ? <p role="status" className="mt-4 text-sm text-[#786963]">Loading orders…</p> : <>
      {!result.docs.length && <p className="mt-4 text-sm text-[#786963]">There are no orders to show yet. <Link href="/all-products" className="underline">Explore the collection</Link></p>}
      <div className="mt-5 space-y-6">{result.docs.map((order) => <article key={order.orderNumber} className="rounded-xl border border-[#eadfdb] p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-medium">Order {order.orderNumber}</h3>
          <p className="text-sm">{new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'USD' }).format(order.total)}</p>
        </div>
        <p className="mt-2 text-xs text-[#786963]">{new Date(order.createdAt).toLocaleDateString()}</p>
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div><dt className="inline">Payment: </dt><dd className="inline capitalize">{order.paymentStatus}</dd></div>
          <div><dt className="inline">Fulfillment: </dt><dd className="inline capitalize">{order.fulfillmentStatus}</dd></div>
        </dl>
        <ul className="mt-4 space-y-2 text-sm">{order.items.map((item, index) => <li key={index}>{item.title}{item.variant ? ` — ${item.variant}` : ''} × {item.quantity}</li>)}</ul>
        {(order.trackingNumber || order.trackingUrl) && <p className="mt-4 text-sm break-all">{order.trackingNumber && <>Tracking number: {order.trackingNumber}</>}{order.trackingNumber && order.trackingUrl && ' · '}{order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="underline">Track shipment</a>}</p>}
      </article>)}</div>
      {result.totalPages > 1 && <nav aria-label="Your orders pages" className="mt-6 flex items-center gap-5 text-sm">
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="underline disabled:opacity-40">Previous</button>
        <span>Page {page} of {result.totalPages}</span>
        <button disabled={page >= result.totalPages} onClick={() => onPageChange(page + 1)} className="underline disabled:opacity-40">Next</button>
      </nav>}
    </>}
  </section>
}

export default function CustomerAccount() {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/customer/session', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Sign in is temporarily unavailable. Please try again later.')
        return response.json()
      })
      .then((result) => setCustomer(result.customer))
      .catch((requestError) => { if (requestError.name !== 'AbortError') setError(requestError.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  async function signIn(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/customer/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to sign in. Please try again.')
      setCustomer(result.customer)
      setPassword('')
      setPage(1)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/customer/session', { method: 'DELETE', headers: { 'Content-Type': 'application/json' } })
      if (!response.ok) throw new Error('Unable to sign out. Please try again.')
      setCustomer(null)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return <main className="min-h-screen bg-[#fffdfa] text-[#302522]">
    <Navbar />
    <section className="mx-auto max-w-3xl px-5 py-14 md:py-20">
      <h1 className="font-serif text-4xl">{customer ? 'Your account' : 'Sign in'}</h1>
      {loading ? <p role="status" className="mt-6 text-sm text-[#786963]">Loading your account…</p> : customer ? <>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div><p>{customer.fullName ? `Welcome, ${customer.fullName}` : 'Welcome back'}</p><p className="mt-1 break-all text-sm text-[#786963]">{customer.email}</p></div>
          <button type="button" disabled={busy} onClick={signOut} className="rounded-full border border-[#d8c9c1] px-5 py-2 text-sm disabled:opacity-50">{busy ? 'Signing out…' : 'Sign out'}</button>
        </div>
        {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        <CustomerOrders key={`${customer.id}:${page}`} page={page} onPageChange={setPage} />
      </> : <div className="mt-5 max-w-md">
        <p className="text-sm leading-relaxed text-[#786963]">Sign in with your email address and password to view your orders.</p>
        <form onSubmit={signIn} className="mt-7 grid gap-5">
          <label className="text-sm">Email address<input name="email" type="email" autoComplete="username" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 block w-full rounded-lg border border-[#d8c9c1] bg-white px-4 py-3" /></label>
          <label className="text-sm">Password<input name="password" type="password" autoComplete="current-password" required maxLength={4096} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 block w-full rounded-lg border border-[#d8c9c1] bg-white px-4 py-3" /></label>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button disabled={busy} className="rounded-full bg-[#754b43] py-3 text-white disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="mt-5 text-sm text-[#786963]">Need help signing in? <Link href="/contact-us" className="underline">Contact us</Link>.</p>
        <Link href="/my-orders" className="mt-6 inline-block text-sm underline">Track an order without signing in</Link>
      </div>}
    </section>
    <Footer />
  </main>
}
