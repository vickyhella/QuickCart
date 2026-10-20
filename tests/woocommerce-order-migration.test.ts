import assert from 'node:assert/strict'
import test from 'node:test'
import { buildOrder, matchProduct, matchVariant, nativeOrderNumber } from '../scripts/migrate-woocommerce-customers-orders.mjs'

test('imports use stable new-format order numbers and unambiguous current product IDs', () => {
  assert.match(nativeOrderNumber('42'), /^GN-[A-F0-9]{24}$/)
  assert.equal(nativeOrderNumber('42'), nativeOrderNumber('42'))
  assert.notEqual(nativeOrderNumber('42'), nativeOrderNumber('43'))
  const product = { id: 12, title: 'Grapefruit Cat Eye' }
  assert.equal(matchProduct('Grapefruit Cat Eyes (Medium)', [product]), product)
  assert.equal(matchProduct('Unrelated product', [product]), undefined)
  assert.equal(matchProduct('Grapefruit Cat Eyes', [product, { ...product, id: 13 }]), undefined)
})

test('variant mapping respects every historical option and never substitutes a different length or pack', () => {
  const short = { id: 'new-short', length: 'short', shape: 'square', size: 's' }
  const xshort = { id: 'new-xshort', length: 'x-short', shape: 'square', size: 's' }
  const product = { id: 1, title: 'Test', variants: [short, xshort] }
  assert.equal(matchVariant('length and shape: x-short-square · size: s', product), xshort)
  assert.equal(matchVariant('length: short · shape: square · size: s', product), short)
  assert.equal(matchVariant('length: medium · shape: square · size: s', product), undefined)
  assert.equal(matchVariant('quantity: 2-sets · size: s', product), undefined)
})

test('historical discounts reconcile using existing fields, with no old IDs or extra address/amount fields', () => {
  const order = buildOrder({ id: '42', status: 'wc-cancelled', currency: 'USD', total_amount: '9', tax_amount: '0', billing_email: 'customer@example.test', date_created_gmt: '2025-01-22 10:00:00' }, {
    customers: [], usermeta: [], orders: [], orderMeta: [],
    addresses: [{ order_id: '42', address_type: 'shipping', first_name: 'Test', last_name: 'Customer', address_1: '1 Test Street', city: 'Test', postcode: '10000', country: 'US' }],
    items: [{ order_id: '42', order_item_id: '1', order_item_type: 'line_item', order_item_name: 'Missing product' }, { order_id: '42', order_item_id: '2', order_item_type: 'shipping' }],
    itemMeta: [['_qty', '2'], ['_product_id', '99'], ['_variation_id', '100'], ['_line_subtotal', '10'], ['_line_total', '8']].map(([meta_key, meta_value]) => ({ order_item_id: '1', meta_key, meta_value })).concat([{ order_item_id: '2', meta_key: 'cost', meta_value: '1' }]),
  }, [])
  assert.equal(order.reconciled, true)
  assert.equal(order.data.items[0].unitPrice, 5)
  assert.equal(order.data.items[0].product, null)
  assert.equal(order.data.items[0].variantId, '')
  assert.equal(order.data.discountTotal, 2)
  assert.equal(order.data.total, 9)
  assert.equal(order.data.paymentStatus, 'pending')
  assert.equal(order.data.fulfillmentStatus, 'cancelled')
  assert.equal(order.data.createdAt, '2025-01-22T10:00:00.000Z')
  assert.doesNotMatch(JSON.stringify(order.data), /legacy|billingAddress|lineSubtotal|lineTotal/)
})
