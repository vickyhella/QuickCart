'use client'

import { useEffect, useRef, useState } from 'react'

export default function PayPalCardButton({ clientId, currency, disabled, createOrder, onBusy, onError }) {
  const containerRef = useRef(null)
  const [eligible, setEligible] = useState(false)
  const createOrderRef = useRef(createOrder)
  const onBusyRef = useRef(onBusy)
  const onErrorRef = useRef(onError)

  useEffect(() => { createOrderRef.current = createOrder }, [createOrder])
  useEffect(() => { onBusyRef.current = onBusy }, [onBusy])
  useEffect(() => { onErrorRef.current = onError }, [onError])

  useEffect(() => {
    if (!clientId || !containerRef.current) return
    let active = true
    let script
    const render = () => {
      if (!active || !window.paypal?.Buttons || !containerRef.current) return
      const button = window.paypal.Buttons({
        fundingSource: window.paypal.FUNDING.CARD,
        createOrder: async () => {
          onBusyRef.current(true)
          try {
            return await createOrderRef.current()
          } catch (error) {
            onBusyRef.current(false)
            throw error
          }
        },
        onApprove: ({ orderID }) => {
          window.location.assign(`/api/checkout/paypal-return?token=${encodeURIComponent(orderID)}`)
        },
        onCancel: () => onBusyRef.current(false),
        onError: (error) => {
          onBusyRef.current(false)
          onErrorRef.current(error?.message || 'PayPal card payment could not be started.')
        },
      })
      if (button.isEligible()) {
        setEligible(true)
        button.render(containerRef.current).catch((error) => onErrorRef.current(error?.message || 'PayPal card payment could not be loaded.'))
      }
    }

    if (window.paypal?.Buttons) {
      render()
    } else {
      script = document.getElementById('paypal-card-sdk')
      if (!script) {
        script = document.createElement('script')
        script.id = 'paypal-card-sdk'
        script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency || 'USD')}&intent=capture&components=buttons&enable-funding=card`
        script.async = true
        script.onload = render
        script.onerror = () => onErrorRef.current('PayPal card payment could not be loaded.')
        document.head.appendChild(script)
      } else {
        script.addEventListener('load', render, { once: true })
      }
    }

    return () => {
      active = false
      containerRef.current?.replaceChildren()
    }
  }, [clientId, currency])

  return <div className={disabled ? 'pointer-events-none opacity-50' : ''}>
    {eligible && <div className="flex items-center gap-3 my-5 text-xs text-[#827873]"><span className="h-px flex-1 bg-[#d8c9c1]" /><span>OR PAY BY CARD</span><span className="h-px flex-1 bg-[#d8c9c1]" /></div>}
    <div aria-label="Pay by debit or credit card via PayPal" ref={containerRef} />
  </div>
}
