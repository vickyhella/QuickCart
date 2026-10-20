import config from '@payload-config'
import { getPayload } from 'payload'
import { getCustomerSession } from '@/lib/customer-session'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'private, no-store' }
  const payload = await getPayload({ config })
  const customer = await getCustomerSession(payload, request.headers)
  if (!customer) return Response.json({ error: 'Please sign in.' }, { status: 401, headers })
  const page = Math.max(1, Math.min(10000, Number.parseInt(new URL(request.url).searchParams.get('page') || '1', 10) || 1))
  const result = await payload.find({
    collection: 'orders', where: { customerEmail: { equals: customer.email } },
    limit: 20, page, sort: '-createdAt', depth: 0, overrideAccess: true,
  })
  return Response.json({
    docs: result.docs.map((order) => ({
      orderNumber: order.orderNumber, createdAt: order.createdAt, currency: order.currency, total: order.total,
      paymentStatus: order.paymentStatus, fulfillmentStatus: order.fulfillmentStatus, trackingNumber: order.trackingNumber || '',
      items: (order.items || []).map(({ title, variant, quantity }) => ({ title, variant, quantity })),
    })),
    page: result.page, totalPages: result.totalPages, totalDocs: result.totalDocs,
  }, { headers })
}
