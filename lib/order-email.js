import { getEnvironmentVariable } from './environment-config'

const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]))

export function getOrderEmailEvents(doc, previousDoc) {
  if (!previousDoc) return []
  const events = []
  if (doc.paymentStatus === 'paid' && previousDoc.paymentStatus !== 'paid') events.push('confirmation')
  if (doc.fulfillmentStatus === 'shipped' && (
    previousDoc.fulfillmentStatus !== 'shipped' ||
    doc.trackingNumber !== previousDoc.trackingNumber ||
    doc.trackingUrl !== previousDoc.trackingUrl
  )) events.push('shipment')
  return events
}

export function buildOrderEmail(order, type, siteURL = 'https://ginnynana.com') {
  const isShipment = type === 'shipment'
  const subject = isShipment ? `Your order ${order.orderNumber} has shipped` : `Payment confirmed for order ${order.orderNumber}`
  const greeting = escapeHTML(order.shippingAddress?.fullName || 'there')
  const items = (order.items || []).map((item) => `${item.title}${item.variant ? ` — ${item.variant}` : ''} × ${item.quantity}`).join('\n')
  const trackingURL = /^https?:\/\//i.test(String(order.trackingUrl || '')) ? String(order.trackingUrl) : ''
  const tracking = `${order.trackingNumber ? `Tracking number: ${order.trackingNumber}` : ''}${trackingURL ? `${order.trackingNumber ? '\n' : ''}Track your shipment: ${trackingURL}` : ''}`
  const heading = isShipment ? 'Your order is on its way' : 'Thank you for your order'
  const total = new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'USD' }).format(Number(order.total) || 0)
  const statusText = isShipment
    ? `${heading}\n\n${tracking || 'Your order has been marked as shipped.'}`
    : `${heading}\n\nWe have received your payment for order ${order.orderNumber}. Total: ${total}.`
  const text = `Hi ${order.shippingAddress?.fullName || 'there'},\n\n${statusText}\n\nOrder ${order.orderNumber}\n${items}\n${isShipment ? '' : `Total: ${total}\n`}\nView your orders: ${siteURL.replace(/\/$/, '')}/account`
  const trackingHTML = order.trackingNumber || trackingURL
    ? `${order.trackingNumber ? `<p>Tracking number: <strong>${escapeHTML(order.trackingNumber)}</strong></p>` : ''}${trackingURL ? `<p><a href="${escapeHTML(trackingURL)}">Track your shipment</a></p>` : ''}`
    : ''
  const html = `<main style="font-family:Arial,sans-serif;line-height:1.6;color:#302522"><h1>${heading}</h1><p>Hi ${greeting},</p><p>${isShipment ? 'Your order has shipped.' : `We have received your payment for order <strong>${escapeHTML(order.orderNumber)}</strong>. Total: <strong>${escapeHTML(total)}</strong>.`}</p>${trackingHTML}<h2>Order ${escapeHTML(order.orderNumber)}</h2><ul>${(order.items || []).map((item) => `<li>${escapeHTML(item.title)}${item.variant ? ` — ${escapeHTML(item.variant)}` : ''} × ${escapeHTML(item.quantity)}</li>`).join('')}</ul><p><a href="${escapeHTML(`${siteURL.replace(/\/$/, '')}/account`)}">View your orders</a></p></main>`
  return { subject, text, html }
}

export async function sendOrderEmail(order, type, { env = process.env, fetchImpl = fetch } = {}) {
  const apiKey = getEnvironmentVariable('RESEND_API_KEY', env)
  const from = getEnvironmentVariable('ORDER_EMAIL_FROM', env)
  if (!apiKey || !from) return { sent: false, reason: 'not-configured' }

  const siteURL = getEnvironmentVariable('NEXT_PUBLIC_SITE_URL', env) || 'https://ginnynana.com'
  const email = buildOrderEmail(order, type, siteURL)
  const response = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [order.customerEmail], ...email }),
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error(`Resend email failed (${response.status}): ${await response.text()}`)
  return { sent: true }
}
