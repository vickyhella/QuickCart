import assert from 'node:assert/strict'
import test from 'node:test'
import { buildOrderEmail, getOrderEmailEvents, sendOrderEmail } from '../lib/order-email.js'

const order = {
  orderNumber: 'GN-ABC123',
  customerEmail: 'buyer@example.com',
  paymentStatus: 'paid',
  fulfillmentStatus: 'shipped',
  trackingNumber: 'TRACK-123',
  trackingUrl: 'https://carrier.example/track?id=123&from=shop',
  shippingAddress: { fullName: 'A <Buyer>' },
  items: [{ title: 'Nails & Roses', variant: 'Medium', quantity: 2 }],
}

test('order email events fire only on paid or shipment changes', () => {
  assert.deepEqual(getOrderEmailEvents(order, undefined), [])
  assert.deepEqual(getOrderEmailEvents(order, { ...order, paymentStatus: 'pending', fulfillmentStatus: 'unfulfilled' }), ['confirmation', 'shipment'])
  assert.deepEqual(getOrderEmailEvents(order, { ...order, paymentStatus: 'paid', fulfillmentStatus: 'shipped' }), [])
  assert.deepEqual(getOrderEmailEvents(order, { ...order, trackingNumber: 'TRACK-OLD' }), ['shipment'])
})

test('customer email content escapes user data and includes a clickable tracking URL', () => {
  const email = buildOrderEmail(order, 'shipment', 'https://ginnynana.com/')
  assert.match(email.subject, /has shipped/)
  assert.match(email.html, /A &lt;Buyer&gt;/)
  assert.match(email.html, /Nails &amp; Roses/)
  assert.match(email.html, /href="https:\/\/carrier\.example\/track\?id=123&amp;from=shop"/)
  assert.match(email.text, /https:\/\/carrier\.example\/track\?id=123&from=shop/)
})

test('Resend request is skipped until configured and posts to the transaction API when configured', async () => {
  const unconfigured = await sendOrderEmail(order, 'confirmation', { env: { NODE_ENV: 'production' } })
  assert.deepEqual(unconfigured, { sent: false, reason: 'not-configured' })

  let request
  const result = await sendOrderEmail(order, 'confirmation', {
    env: {
      NODE_ENV: 'production',
      QUICKCART_ENVIRONMENT: 'production',
      RESEND_API_KEY: 'test-key',
      ORDER_EMAIL_FROM: 'Ginny Nana <orders@example.com>',
      NEXT_PUBLIC_SITE_URL: 'https://ginnynana.com',
    },
    fetchImpl: async (url, options) => {
      request = { url, options }
      return new Response(null, { status: 200 })
    },
  })
  assert.deepEqual(result, { sent: true })
  assert.equal(request.url, 'https://api.resend.com/emails')
  assert.equal(request.options.headers.Authorization, 'Bearer test-key')
  assert.equal(JSON.parse(request.options.body).to[0], order.customerEmail)
})
