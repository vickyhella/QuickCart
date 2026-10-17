import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { capturePayPalOrder } from '@/lib/paypal-order'
import { isPayPalConfigured, paypalRequest } from '@/lib/paypal'

export async function POST(request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 })
  }
  if (!isPayPalConfigured()) return NextResponse.json({ error: 'PayPal is not configured.' }, { status: 503 })
  try {
    const { orderId } = await request.json()
    if (typeof orderId !== 'string' || !/^[A-Z0-9]{1,64}$/.test(orderId)) {
      return NextResponse.json({ error: 'Invalid PayPal order ID.' }, { status: 400 })
    }
    const payload = await getPayload({ config })
    const order = await capturePayPalOrder(payload, orderId, paypalRequest)
    return NextResponse.json({ orderNumber: order.orderNumber })
  } catch (error) {
    console.error('PayPal card capture failed:', error)
    return NextResponse.json({ error: 'Payment could not be confirmed. Please check your order or contact us before trying again.' }, { status: 502 })
  }
}
