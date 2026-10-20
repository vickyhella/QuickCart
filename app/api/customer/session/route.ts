import config from '@payload-config'
import { getPayload } from 'payload'
import { customerCookie, getCustomerSession, isSameOriginJSON, publicCustomer, revokeCustomerSession } from '@/lib/customer-session'

export const dynamic = 'force-dynamic'
const noStore = { 'Cache-Control': 'private, no-store' }

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const customer = await getCustomerSession(payload, request.headers)
  return Response.json({ customer: customer ? publicCustomer(customer) : null }, { headers: noStore })
}

export async function POST(request: Request) {
  if (!isSameOriginJSON(request)) return Response.json({ error: 'Request not allowed.' }, { status: 403, headers: noStore })
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid request.' }, { status: 400, headers: noStore }) }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = body.password
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254 || typeof password !== 'string' || !password || Buffer.byteLength(password) > 4096) {
    return Response.json({ error: 'Enter your email address and password.' }, { status: 400, headers: noStore })
  }
  const payload = await getPayload({ config })
  try {
    const { token, user } = await payload.login({ collection: 'customers', data: { email, password }, depth: 0 })
    return Response.json({ customer: publicCustomer(user) }, { headers: { ...noStore, 'Set-Cookie': customerCookie(payload, token) } })
  } catch (error) {
    if (error instanceof Error && ['AuthenticationError', 'LockedAuth', 'UnverifiedEmail'].includes(error.name)) {
      return Response.json({ error: 'Unable to sign in. Check your email and password, or try again later.' }, { status: 401, headers: noStore })
    }
    return Response.json({ error: 'Sign in is temporarily unavailable. Please try again later.' }, { status: 503, headers: noStore })
  }
}

export async function DELETE(request: Request) {
  if (!isSameOriginJSON(request)) return Response.json({ error: 'Request not allowed.' }, { status: 403, headers: noStore })
  const payload = await getPayload({ config })
  const customer = await getCustomerSession(payload, request.headers)
  await revokeCustomerSession(payload, customer)
  return Response.json({ customer: null }, { headers: { ...noStore, 'Set-Cookie': customerCookie(payload) } })
}
