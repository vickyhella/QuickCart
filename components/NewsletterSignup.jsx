'use client'

import { useState } from 'react'

export default function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState({ kind: 'idle', message: '' })
  const [submitting, setSubmitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setStatus({ kind: 'idle', message: '' })
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent, website }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Please try again.')
      setStatus({ kind: 'success', message: 'You’re on the list. Look out for a little Ginny Nana in your inbox.' })
      setEmail('')
      setConsent(false)
    } catch (error) {
      setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'We could not save your subscription. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section aria-labelledby="newsletter-heading" className="bg-[#f1eaf2] px-5 py-14 sm:px-8 md:py-16 lg:px-16">
      <div className="mx-auto grid max-w-7xl gap-8 rounded-[1.5rem] border border-[#d9cddd] bg-[#fbf8f5] p-6 sm:p-9 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-12 lg:p-12">
        <div>
          <p className="text-xs font-semibold tracking-[.14em] text-[#704576]">A LITTLE NOTE FROM US</p>
          <h2 id="newsletter-heading" className="mt-3 max-w-xl font-serif text-4xl leading-tight tracking-[-.04em] sm:text-5xl">Good things, straight to your inbox.</h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-[#615364]">New nail art, little surprises, and first dibs on the next drop.</p>
        </div>
        <form onSubmit={submit} className="grid gap-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input id="newsletter-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email address" className="ui-input min-w-0 flex-1" />
            <button type="submit" disabled={submitting} className="ui-button ui-button--primary shrink-0">{submitting ? 'Joining…' : 'Subscribe'}</button>
          </div>
          <label className="flex items-start gap-2 text-xs leading-5 text-[#615364]">
            <input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 accent-[#704576]" />
            <span>I agree to receive email updates from Ginny Nana. To opt out, email <a className="underline underline-offset-2" href="mailto:ginnynana@hotmail.com?subject=Newsletter%20unsubscribe">ginnynana@hotmail.com</a>.</span>
          </label>
          <label aria-hidden="true" className="hidden">Leave this field empty<input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
          <p role="status" aria-live="polite" className={`min-h-5 text-sm ${status.kind === 'error' ? 'text-[#9d343b]' : status.kind === 'success' ? 'text-[#306341]' : 'text-[#615364]'}`}>{status.message}</p>
        </form>
      </div>
    </section>
  )
}
