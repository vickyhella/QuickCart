'use client'

import { useEffect, useState } from 'react'

export default function PaymentMethods({ className = '' }) {
  const [cardPaymentsEnabled, setCardPaymentsEnabled] = useState(false)

  useEffect(() => {
    fetch('/api/checkout/paypal-config')
      .then((response) => response.ok ? response.json() : null)
      .then((config) => setCardPaymentsEnabled(Boolean(config?.cardPaymentsEnabled)))
      .catch(() => {})
  }, [])

  return (
    <div aria-label="Accepted payment methods" className={`flex w-full items-center justify-center gap-2 ${className}`}>
      <span className="inline-flex items-center gap-1 rounded border border-[#d8c9c1] bg-white px-2 py-1 text-xs font-semibold text-[#173c78]">
        <span className="text-base font-black italic text-[#0879be]" aria-hidden="true">P</span> PayPal
      </span>
      {cardPaymentsEnabled && <>
        <span className="rounded border border-[#d8c9c1] bg-white px-2 py-1 text-xs font-black italic text-[#1a1f71]" aria-label="Visa">VISA</span>
        <span className="inline-flex items-center rounded border border-[#d8c9c1] bg-white px-2 py-1" aria-label="Mastercard">
          <span className="h-3 w-3 rounded-full bg-[#eb001b]" aria-hidden="true" />
          <span className="-ml-1.5 h-3 w-3 rounded-full bg-[#f79e1b]" aria-hidden="true" />
        </span>
      </>}
    </div>
  )
}
