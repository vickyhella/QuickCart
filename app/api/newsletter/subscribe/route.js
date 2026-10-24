import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json()
    if (String(body.website || '').trim()) return Response.json({ success: true })

    const email = String(body.email || '').trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
      return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }
    if (body.consent !== true) {
      return Response.json({ error: 'Please confirm that you would like to receive email updates.' }, { status: 400 })
    }

    const payload = await getPayload({ config })
    const existing = await payload.find({
      collection: 'newsletter-subscribers',
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const current = existing.docs[0]
    if (current?.status === 'active') return Response.json({ success: true })

    const data = { email, status: 'active', consentAt: new Date().toISOString(), source: 'homepage' }
    if (current) await payload.update({ collection: 'newsletter-subscribers', id: current.id, data, overrideAccess: true })
    else await payload.create({ collection: 'newsletter-subscribers', data, overrideAccess: true })

    return Response.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Newsletter subscription failed:', error)
    return Response.json({ error: 'We could not save your subscription. Please try again.' }, { status: 500 })
  }
}
