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
      setStatus({ kind: 'success', message: 'You’re on the list. Your email preferences have been saved.' })
      setEmail('')
      setConsent(false)
    } catch (error) {
      setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'We could not save your subscription. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section aria-labelledby="newsletter-heading" className="bg-[#f1eaf2] py-8 md:py-10">
      <div className="storefront-container">
        <div className="mx-auto grid gap-5 lg:grid-cols-2 lg:items-center lg:gap-10">
          <div>
            <h2 id="newsletter-heading" className="font-serif text-3xl leading-tight tracking-[-.03em]">Keep in touch.</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#615364]">Leave your email for future collection updates.</p>
          </div>
          <form onSubmit={submit} className="grid gap-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input id="newsletter-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email address" className="ui-input min-w-0 flex-1" />
              <button type="submit" disabled={submitting} className="ui-button ui-button--primary shrink-0">{submitting ? 'Joining…' : 'Subscribe'}</button>
            </div>
            <label className="flex items-start gap-2 text-xs leading-5 text-[#615364]">
              <input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 accent-[#704576]" />
              <span>I agree to receive email updates from Ginny Nana.</span>
            </label>
            <label aria-hidden="true" className="hidden">Leave this field empty<input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
            <p role="status" aria-live="polite" className={`min-h-5 text-sm ${status.kind === 'error' ? 'text-[#9d343b]' : status.kind === 'success' ? 'text-[#306341]' : 'text-[#615364]'}`}>{status.message}</p>
          </form>
        </div>
      </div>
    </section>
  )
}
