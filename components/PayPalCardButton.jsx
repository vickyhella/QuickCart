'use client'

import { useEffect, useRef, useState } from 'react'

export default function PayPalCardButton({ clientId, currency, disabled, createOrder, onBusy, onError }) {
  const containerRef = useRef(null)
  const fieldsRef = useRef(null)
  const submittingRef = useRef(false)
  const captureStartedRef = useRef(false)
  const [status, setStatus] = useState('loading')
  const createOrderRef = useRef(createOrder)
  const onBusyRef = useRef(onBusy)
  const onErrorRef = useRef(onError)

  useEffect(() => { createOrderRef.current = createOrder }, [createOrder])
  useEffect(() => { onBusyRef.current = onBusy }, [onBusy])
  useEffect(() => { onErrorRef.current = onError }, [onError])

  useEffect(() => {
    if (!clientId || !containerRef.current) return
    let active = true
    const container = containerRef.current
    let fields = []
    const fail = (message) => {
      if (!active || captureStartedRef.current) return
      submittingRef.current = false
      onBusyRef.current(false)
      onErrorRef.current(message)
    }
    const render = async () => {
      if (!active) return
      try {
        if (!window.paypal?.CardFields) throw new Error('Card fields are unavailable.')
        const cardFields = window.paypal.CardFields({
          createOrder: () => createOrderRef.current(),
          onApprove: async ({ orderID }) => {
            captureStartedRef.current = true
            try {
              const response = await fetch('/api/checkout/paypal-capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: orderID }),
              })
              const result = await response.json()
              if (!response.ok || !result.orderNumber) throw new Error(result.error || 'Payment could not be confirmed. Please contact us before trying again.')
              window.location.assign(`/order-placed?orderNumber=${encodeURIComponent(result.orderNumber)}`)
            } catch (error) {
              // Keep both payment options locked when a capture may already have succeeded.
              if (active) onErrorRef.current(error.message || 'Payment could not be confirmed. Please contact us before trying again.')
            }
          },
          onCancel: () => fail('Card payment was cancelled.'),
          onError: () => fail('Card payment could not be completed. Please check your order before trying again.'),
          style: { input: { 'font-size': '16px', color: '#302522' } },
        })
        if (!cardFields.isEligible()) {
          setStatus('unavailable')
          return
        }
        fieldsRef.current = cardFields
        fields = ['NameField', 'NumberField', 'ExpiryField', 'CVVField'].map((name) => cardFields[name]())
        await Promise.all(fields.map((field, index) => field.render(container.children[index].lastElementChild)))
        if (active) setStatus('ready')
      } catch {
        if (active) setStatus('unavailable')
      }
    }

    const sdkURL = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency || 'USD')}&intent=capture&components=card-fields`
    let script = document.getElementById('paypal-card-sdk')
    if (script && (script.src !== sdkURL || script.dataset.failed === 'true')) {
      script.remove()
      script = null
    }
    const loadError = () => {
      script.dataset.failed = 'true'
      if (active) setStatus('unavailable')
    }
    if (!script) {
      script = document.createElement('script')
      script.id = 'paypal-card-sdk'
      script.src = sdkURL
      script.async = true
      script.addEventListener('load', render, { once: true })
      script.addEventListener('error', loadError, { once: true })
      script.addEventListener('load', () => { script.dataset.loaded = 'true' }, { once: true })
      document.head.appendChild(script)
    } else if (script.dataset.loaded === 'true') {
      render()
    } else {
      script.addEventListener('load', render, { once: true })
      script.addEventListener('error', loadError, { once: true })
    }

    return () => {
      active = false
      fieldsRef.current = null
      script.removeEventListener('load', render)
      script.removeEventListener('error', loadError)
      for (const field of fields) field.close()
    }
  }, [clientId, currency])

  const submit = async () => {
    if (disabled || submittingRef.current || !fieldsRef.current) return
    submittingRef.current = true
    onBusyRef.current(true)
    onErrorRef.current('')
    try {
      const state = await fieldsRef.current.getState()
      if (!state.isFormValid) throw new Error('Please check your card details.')
      await fieldsRef.current.submit()
    } catch (error) {
      if (!captureStartedRef.current) {
        submittingRef.current = false
        onBusyRef.current(false)
      }
      onErrorRef.current(error?.message || 'Card payment could not be completed. Please check your order before trying again.')
    }
  }

  return <section aria-label="Pay by debit or credit card">
    <div className="flex items-center gap-3 my-5 text-xs text-[#827873]"><span className="h-px flex-1 bg-[#d8c9c1]" /><span>OR PAY BY CARD</span><span className="h-px flex-1 bg-[#d8c9c1]" /></div>
    {status === 'loading' && <p role="status" className="text-xs text-[#827873]">Loading secure card payment…</p>}
    {status === 'unavailable' && <p role="status" className="text-xs text-[#827873]">Card payments are currently unavailable. Please use PayPal above.</p>}
    <fieldset disabled={disabled || status !== 'ready'} className={status === 'unavailable' ? 'hidden' : 'space-y-3 disabled:opacity-50'}>
      <legend className="sr-only">Card details</legend>
      <div ref={containerRef} className="space-y-3">
        {['Cardholder name', 'Card number', 'Expiry date', 'Security code'].map((label) => <div key={label}>
          <span className="text-sm">{label}</span>
          <div aria-label={label} className="h-12 rounded-lg border border-[#d8c9c1] bg-white" />
        </div>)}
      </div>
      <button type="button" onClick={submit} disabled={disabled || status !== 'ready'} className="ui-button ui-button--primary w-full">Pay by card</button>
      <p className="text-xs text-[#827873]">By paying with your card, you acknowledge that your data will be processed by PayPal subject to the <a href="https://www.paypal.com/privacy-full" target="_blank" rel="noopener noreferrer" className="underline">PayPal Privacy Statement</a>.</p>
    </fieldset>
  </section>
}
