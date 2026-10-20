import type { Payload } from 'payload'
import { createLocalReq, logoutOperation } from 'payload'
import { generatePayloadCookie, generateExpiredPayloadCookie, parseCookies } from 'payload/shared'

const cookiePrefix = 'ginny-customer'

export async function getCustomerSession(payload: Payload, headers: Headers) {
  const token = parseCookies(headers).get(`${cookiePrefix}-token`)
  if (!token) return null
  const customerHeaders = new Headers({ Authorization: `JWT ${token}`, DisableAutologin: 'true' })
  const { user } = await payload.auth({ headers: customerHeaders })
  return user?.collection === 'customers' ? user : null
}

export function customerCookie(payload: Payload, token?: string) {
  const options = { collectionAuthConfig: payload.collections.customers.config.auth, cookiePrefix }
  return token ? generatePayloadCookie({ ...options, token }) : generateExpiredPayloadCookie(options)
}

export async function revokeCustomerSession(payload: Payload, customer: Awaited<ReturnType<typeof getCustomerSession>>) {
  if (!customer) return
  const req = await createLocalReq({ user: customer }, payload)
  await logoutOperation({ collection: payload.collections.customers, req })
}

export function publicCustomer(customer: { id: string | number; email?: string; fullName?: string }) {
  return { id: customer.id, email: customer.email, fullName: customer.fullName || '' }
}

export function isSameOriginJSON(request: Request) {
  const origin = request.headers.get('origin')
  return (!origin || origin === new URL(request.url).origin) &&
    request.headers.get('content-type')?.split(';')[0].trim() === 'application/json'
}
