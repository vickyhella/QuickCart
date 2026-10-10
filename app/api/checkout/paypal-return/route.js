import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { markOrderPaid } from '@/lib/complete-order'
import { paypalRequest } from '@/lib/paypal'

export async function GET(request) {
  const token = new URL(request.url).searchParams.get('token')
  if (!token) return NextResponse.redirect(new URL('/cart?payment=missing-token', request.url))

  try {
    const paypalOrder = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(token)}`)
    const orderId = paypalOrder.purchase_units?.[0]?.custom_id
    if (!orderId) throw new Error('PayPal 订单没有关联到本地订单。')
    if (paypalOrder.status !== 'COMPLETED') {
      const captured = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(token)}/capture`, {
        method: 'POST',
        requestId: `capture-${token}`,
      })
      const captureStatus = captured.purchase_units?.[0]?.payments?.captures?.[0]?.status
      if (captureStatus !== 'COMPLETED') throw new Error('PayPal 尚未确认付款完成。')
    }

    const payload = await getPayload({ config })
    const order = await markOrderPaid(payload, orderId, token)
    return NextResponse.redirect(new URL(`/order-placed?orderNumber=${encodeURIComponent(order.orderNumber)}`, request.url))
  } catch (error) {
    console.error('PayPal capture failed:', error)
    return NextResponse.redirect(new URL('/cart?payment=failed', request.url))
  }
}
