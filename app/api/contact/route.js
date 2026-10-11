import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json()
    // Quietly accept bot submissions that filled the hidden honeypot.
    if (String(body.website || '').trim()) return NextResponse.json({ success: true })

    const name = String(body.name || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const subject = String(body.subject || '').trim()
    const message = String(body.message || '').trim()
    if (!name || name.length > 100) return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 })
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    if (!subject || subject.length > 150) return NextResponse.json({ error: 'Please enter a subject.' }, { status: 400 })
    if (!message || message.length > 8000) return NextResponse.json({ error: 'Please enter a message (up to 8,000 characters).' }, { status: 400 })

    const payload = await getPayload({ config })
    await payload.create({
      collection: 'contact-messages',
      data: { name, email, subject, message, status: 'new' },
      overrideAccess: true,
    })
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Contact form submission failed:', error)
    return NextResponse.json({ error: 'We could not send your message. Please try again.' }, { status: 500 })
  }
}
