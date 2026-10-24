'use client'

import { useState } from 'react'

const inputClass = 'mt-2 block w-full rounded-lg border border-[#d8c9c1] bg-white px-4 py-3 text-[#302522] outline-none focus:border-[#754b43] focus:ring-2 focus:ring-[#754b43]/15'

export default function ContactForm() {
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setStatus('')
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form).entries())
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'We could not send your message. Please try again.')
      form.reset()
      setStatus('Thanks for reaching out. Your message has been sent.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'We could not send your message. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return <section className="mt-12 rounded-2xl border border-[#eadfd9] bg-[#fbf7f4] p-5 sm:p-8">
    <h2 className="font-serif text-2xl">Send us a message</h2>
    <p className="mt-2 text-sm text-[#786963]">We usually reply by email. You can also reach us at <a className="underline underline-offset-2" href="mailto:ginnynana@hotmail.com">ginnynana@hotmail.com</a>.</p>
    <form onSubmit={submit} className="mt-6 grid gap-5 sm:grid-cols-2">
      <label className="text-sm font-medium text-[#554944]">Your name<input className={inputClass} name="name" autoComplete="name" maxLength={100} required /></label>
      <label className="text-sm font-medium text-[#554944]">Email address<input className={inputClass} name="email" type="email" autoComplete="email" maxLength={254} required /></label>
      <label className="text-sm font-medium text-[#554944] sm:col-span-2">Subject<input className={inputClass} name="subject" maxLength={150} required /></label>
      <label className="text-sm font-medium text-[#554944] sm:col-span-2">Message<textarea className={`${inputClass} min-h-36 resize-y`} name="message" maxLength={8000} required /></label>
      <label aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">Website<input tabIndex={-1} autoComplete="off" name="website" /></label>
      <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={submitting} className="ui-button ui-button--primary">{submitting ? 'Sending…' : 'Send message'}</button>
        {status && <p role="status" className="text-sm text-[#554944]">{status}</p>}
      </div>
    </form>
  </section>
}
