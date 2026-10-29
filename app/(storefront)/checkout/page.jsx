'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import { useAppContext } from '@/context/AppContext'
import { formatDimension } from '@/lib/format-dimension'
import PaymentMethods from '@/components/PaymentMethods'
import PayPalCardButton from '@/components/PayPalCardButton'
import { getPriceDetails } from '@/lib/product-pricing'

const emptyAddress = { fullName: '', phone: '', address1: '', address2: '', city: '', state: '', postalCode: '', country: 'US' }

export default function CheckoutPage() {
  const { products, cartItems, currency, checkoutCountries: shippingCountries, shippingEstimate } = useAppContext()
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState({ ...emptyAddress, country: shippingCountries[0]?.[0] || 'US' })
  const [promoInput, setPromoInput] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [addOrderNote, setAddOrderNote] = useState(false)
  const [customerNote, setCustomerNote] = useState('')
  const [quote, setQuote] = useState(null)
  const [quoteError, setQuoteError] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [paypalConfig, setPaypalConfig] = useState(null)
  const formRef = useRef(null)
  useEffect(() => { fetch('/api/checkout/paypal-config').then((r) => r.ok ? r.json() : null).then(setPaypalConfig).catch(() => {}) }, [])
  const symbol = currency || '$'

  const lines = useMemo(() => Object.entries(cartItems).flatMap(([lineKey, line]) => {
    const product = products.find((item) => item._id === line?.productId)
    if (!product || !line?.quantity) return []
    const variant = product.variants?.find((item) => String(item.id) === line.variantId)
    return [{ lineKey, line, product, variant, unitPrice: getPriceDetails(product, variant).currentPrice }]
  }), [cartItems, products])

  useEffect(() => {
    if (!lines.length) {
      setQuote(null)
      return
    }
    let active = true
    fetch('/api/checkout/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: lines.map(({ line }) => line),
        promoCode,
      }),
    }).then(async (response) => {
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || '无法计算订单金额。')
      if (active) {
        setQuote(result)
        setQuoteError('')
      }
    }).catch((requestError) => {
      if (active) {
        setQuote(null)
        setQuoteError(requestError.message)
      }
    })
    return () => { active = false }
  }, [lines, promoCode])

  const applyPromo = () => {
    setQuoteError('')
    setPromoCode(promoInput.trim().toUpperCase())
  }

  const createCardOrder = async () => {
    if (!formRef.current?.reportValidity()) throw new Error('Please complete your contact and shipping details.')
    setError('')
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod: 'card', email, address, promoCode, customerNote: addOrderNote ? customerNote : '', items: lines.map(({ line }) => line) }),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Unable to start card payment.')
    if (!result.orderId) throw new Error('PayPal did not return an order ID.')
    return result.orderId
  }

  const startPayPal = async (event) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          address,
          promoCode,
          customerNote: addOrderNote ? customerNote : '',
          items: lines.map(({ line }) => line),
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || '无法开始 PayPal 结账。')
      window.location.assign(result.approvalURL)
    } catch (requestError) {
      setError(requestError.message)
      setBusy(false)
    }
  }

  if (!lines.length) return (
    <main className="min-h-screen bg-[#fffdfa] text-[#302522]">
      <Navbar />
      <section className="px-5 py-24 text-center">
        <h1 className="font-serif text-3xl">Your cart is empty</h1>
        <Link className="inline-block mt-5 underline" href="/all-products">Browse all products</Link>
      </section>
      <Footer />
    </main>
  )

  return (
    <main className="min-h-screen bg-[#fffdfa] text-[#302522]">
      <Navbar />
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-12">
        <p className="text-xs uppercase tracking-[0.25em] text-[#9a756d]">Ginny Nana</p>
        <h1 className="font-serif text-4xl mt-2">Checkout</h1>
        <form ref={formRef} onSubmit={startPayPal} className="grid lg:grid-cols-[1fr_380px] gap-10 mt-9">
          <div className="space-y-8">
            <section className="rounded-xl border border-[#e8ded8] p-5 md:p-7">
              <h2 className="font-serif text-2xl">Contact</h2>
              <label className="block text-sm mt-5">Email address
                <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="block w-full mt-2 rounded-lg border border-[#d8c9c1] px-3 py-3" />
              </label>
            </section>
            <section className="rounded-xl border border-[#e8ded8] p-5 md:p-7">
              <h2 className="font-serif text-2xl">Shipping address</h2>
              <div className="grid sm:grid-cols-2 gap-4 mt-5">
                {[
                  ['fullName', 'Full name', true], ['phone', 'Phone number', false],
                  ['address1', 'Address', true], ['address2', 'Apartment, suite, etc.', false],
                  ['city', 'City', true], ['state', 'State / Province', false],
                  ['postalCode', 'ZIP / Postal code', true],
                ].map(([key, label, required]) => <label key={key} className="text-sm">{label}
                  <input required={required} autoComplete={key === 'address1' ? 'address-line1' : key === 'postalCode' ? 'postal-code' : key} value={address[key]} maxLength={key === 'country' ? 2 : undefined} onChange={(event) => setAddress((current) => ({ ...current, [key]: key === 'country' ? event.target.value.toUpperCase() : event.target.value }))} className="block w-full mt-2 rounded-lg border border-[#d8c9c1] px-3 py-3" />
                </label>)}
                <label className="text-sm">Country
                  <select required autoComplete="country" value={address.country} onChange={(event) => setAddress((current) => ({ ...current, country: event.target.value }))} className="block w-full mt-2 rounded-lg border border-[#d8c9c1] bg-white px-3 py-3">
                    {shippingCountries.map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}
                  </select>
                </label>
              </div>
              <div className="mt-4 rounded-lg bg-[#f8f3ef] p-4 text-sm text-[#6e5c55]">
                <p className="font-medium text-[#302522]">Shipping details</p>
                <p className="mt-1">Shipping to {shippingCountries.find(([code]) => code === address.country)?.[1] || address.country}. The shipping charge is calculated by total product weight and shown in your order summary.</p>
                {quote?.freeShippingThreshold != null && <p className="mt-1">Orders of {symbol}{Number(quote.freeShippingThreshold).toFixed(2)} or more after discounts ship free.</p>}
                {quote?.minimumOrderValue != null && <p className="mt-1">A minimum order of {symbol}{Number(quote.minimumOrderValue).toFixed(2)} is required for shipping.</p>}
                <Link href="/shipping-policy/" className="inline-block mt-2 underline underline-offset-2">Read our shipping policy</Link>
              </div>
            </section>
            <section className="rounded-xl border border-[#e8ded8] p-5 md:p-7">
              <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
                <input type="checkbox" checked={addOrderNote} onChange={(event) => setAddOrderNote(event.target.checked)} className="h-4 w-4 accent-[#754b43]" />
                Add note to your order
              </label>
              {addOrderNote && <label className="mt-4 block text-sm">Order note
                <textarea value={customerNote} onChange={(event) => setCustomerNote(event.target.value)} maxLength={1000} rows={4} placeholder="Add a note for your order" className="mt-2 block w-full rounded-lg border border-[#d8c9c1] px-3 py-3" />
                <span className="mt-1 block text-right text-xs text-[#786963]">{customerNote.length}/1000</span>
              </label>}
            </section>
          </div>

          <aside className="rounded-xl bg-[#f8f3ef] p-5 md:p-7 h-fit">
            <h2 className="font-serif text-2xl">Order summary</h2>
            <div className="space-y-4 mt-5">
              {lines.map(({ lineKey, line, product, unitPrice }) => <div key={lineKey} className="flex gap-3 text-sm">
                <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-white">
                  <Image unoptimized src={product.image[0]} alt={product.name} fill sizes="64px" className="object-cover" />
                  <span className="absolute right-0 top-0 bg-[#754b43] text-white rounded-bl px-1.5 text-xs">{line.quantity}</span>
                </div>
                <div className="flex-1"><p>{product.name}</p><p className="text-xs text-[#786963] mt-1">{[formatDimension(line.length), formatDimension(line.shape)].filter(Boolean).join(' · ')}</p></div>
                <span>{symbol}{(unitPrice * line.quantity).toFixed(2)}</span>
              </div>)}
            </div>
            <div className="flex gap-2 mt-6">
              <input value={promoInput} onChange={(event) => setPromoInput(event.target.value)} placeholder="Discount code" className="min-w-0 flex-1 rounded-lg border border-[#d8c9c1] bg-white px-3 py-2.5 text-sm" />
              <button type="button" onClick={applyPromo} className="ui-button ui-button--secondary">Apply</button>
            </div>
            {promoCode && quote?.discountTotal > 0 && <p className="text-xs text-green-800 mt-2">Code {promoCode} applied.</p>}
            {quoteError && <p role="alert" className="text-xs text-red-700 mt-2">{quoteError}</p>}
            <div className="space-y-3 border-t border-[#d8c9c1] mt-6 pt-5 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{symbol}{(quote?.subtotal ?? lines.reduce((sum, line) => sum + line.unitPrice * line.line.quantity, 0)).toFixed(2)}</span></div>
              {quote?.discountTotal > 0 && <div className="flex justify-between"><span>Discount</span><span>-{symbol}{quote.discountTotal.toFixed(2)}</span></div>}
              <div className="flex justify-between gap-3"><span>Shipping <span className="text-xs text-[#786963]">({shippingEstimate})</span></span><span className="shrink-0">{quote ? (quote.shippingTotal ? `${symbol}${quote.shippingTotal.toFixed(2)}` : 'Free') : 'Calculating…'}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>Included</span></div>
              {quote?.shippingTotal > 0 && quote?.freeShippingThreshold != null && quote.subtotal - quote.discountTotal < quote.freeShippingThreshold && <p className="text-xs text-[#786963]">Spend {symbol}{(quote.freeShippingThreshold - (quote.subtotal - quote.discountTotal)).toFixed(2)} more for free shipping.</p>}
              <div className="flex justify-between border-t border-[#d8c9c1] pt-4 text-base font-medium"><span>Total</span><span>{quote ? `${symbol}${quote.total.toFixed(2)}` : 'Calculating…'}</span></div>
            </div>
            {error && <p role="alert" className="text-sm text-red-700 mt-4">{error}</p>}
            <button type="submit" disabled={busy || !quote || Boolean(quoteError)} className="ui-button ui-button--primary w-full mt-6">
              {busy ? 'Connecting to PayPal…' : 'Pay with PayPal'}
            </button>
            <p className="text-xs text-center text-[#827873] mt-3">You will be redirected to PayPal to approve payment.</p>
            {paypalConfig?.cardPaymentsEnabled && paypalConfig.clientId && <>
              <PayPalCardButton
                clientId={paypalConfig.clientId}
                currency={quote?.currency || 'USD'}
                disabled={busy || !quote || Boolean(quoteError)}
                createOrder={createCardOrder}
                onBusy={setBusy}
                onError={setError}
              />
            </>}
            <PaymentMethods className="justify-center mt-4" />
          </aside>
        </form>
      </section>
      <Footer />
    </main>
  )
}
