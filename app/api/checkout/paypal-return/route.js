import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { capturePayPalOrder } from '@/lib/paypal-order'
import { paypalRequest } from '@/lib/paypal'

export async function GET(request) {
  const token = new URL(request.url).searchParams.get('token')
  if (!token) return NextResponse.redirect(new URL('/cart?payment=missing-token', request.url))

  try {
    const payload = await getPayload({ config })
    const order = await capturePayPalOrder(payload, token, paypalRequest)
    return NextResponse.redirect(new URL(`/order-placed?orderNumber=${encodeURIComponent(order.orderNumber)}`, request.url))
  } catch (error) {
    console.error('PayPal capture failed:', error)
    return NextResponse.redirect(new URL('/cart?payment=failed', request.url))
  }
}
