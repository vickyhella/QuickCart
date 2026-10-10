import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { markOrderPaid } from '@/lib/complete-order'
import { isPayPalConfigured, paypalRequest } from '@/lib/paypal'

export async function POST(request) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!isPayPalConfigured() || !webhookId) {
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 })
  }

  try {
    const event = await request.json()
    const headers = request.headers
    const verification = await paypalRequest('/v1/notifications/verify-webhook-signature', {
      method: 'POST',
      body: {
        auth_algo: headers.get('paypal-auth-algo'),
        cert_url: headers.get('paypal-cert-url'),
        transmission_id: headers.get('paypal-transmission-id'),
        transmission_sig: headers.get('paypal-transmission-sig'),
        transmission_time: headers.get('paypal-transmission-time'),
        webhook_id: webhookId,
        webhook_event: event,
      },
    })
    if (verification.verification_status !== 'SUCCESS') {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
    }

    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const paypalOrderId = event.resource?.supplementary_data?.related_ids?.order_id
      if (paypalOrderId) {
        const payload = await getPayload({ config })
        const matches = await payload.find({
          collection: 'orders',
          where: { paymentReference: { equals: paypalOrderId } },
          limit: 1,
          overrideAccess: true,
        })
        const order = matches.docs[0]
        if (order) await markOrderPaid(payload, order.id, paypalOrderId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('PayPal webhook failed:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
