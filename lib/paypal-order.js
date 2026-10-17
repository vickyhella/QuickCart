import { markOrderPaid } from './complete-order.js'

export function assertPayPalOrderMatches(order, paypalOrder, completed = false) {
  const units = paypalOrder.purchase_units || []
  const unit = units[0]
  if (units.length !== 1 || paypalOrder.id !== order.paymentReference || String(unit?.custom_id) !== String(order.id)) {
    throw new Error('PayPal order does not match the checkout order.')
  }
  const amount = completed ? unit.payments?.captures?.[0]?.amount : unit.amount
  if (amount?.currency_code !== order.currency || Number(amount?.value).toFixed(2) !== Number(order.total).toFixed(2)) {
    throw new Error('PayPal payment amount does not match the checkout total.')
  }
  if (completed && (paypalOrder.status !== 'COMPLETED' || unit.payments?.captures?.length !== 1 || unit.payments.captures[0].status !== 'COMPLETED')) {
    throw new Error('PayPal has not completed the payment. Please check your order before trying again.')
  }
}

export async function capturePayPalOrder(payload, token, requestPayPal) {
  const paypalOrder = await requestPayPal(`/v2/checkout/orders/${encodeURIComponent(token)}`)
  const orderId = paypalOrder.purchase_units?.[0]?.custom_id
  if (!orderId) throw new Error('PayPal order has no checkout order.')
  const order = await payload.findByID({ collection: 'orders', id: orderId, overrideAccess: true })
  assertPayPalOrderMatches(order, paypalOrder)
  if (order.paymentStatus === 'paid') return order
  const captured = paypalOrder.status === 'COMPLETED' ? paypalOrder : await requestPayPal(`/v2/checkout/orders/${encodeURIComponent(token)}/capture`, {
    method: 'POST',
    requestId: `capture-${token}`,
  })
  assertPayPalOrderMatches(order, captured, true)
  return markOrderPaid(payload, order.id, token)
}
