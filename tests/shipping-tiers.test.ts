import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateShippingCharge, findShippingTier, getTotalWeightKg } from '../lib/shipping-tiers'

test('totals product weight by quantity in kilograms, rounded up to four decimals', () => {
  assert.equal(getTotalWeightKg([
    { product: { shippingWeight: 0.2011 }, quantity: 2 },
    { product: { shippingWeight: 0.3 }, quantity: 1 },
  ]), 0.7022)
})

test('uses the 0.2 kg product default when an older product has no valid weight', () => {
  assert.equal(getTotalWeightKg([{ product: {}, quantity: 2 }]), 0.4)
})

test('supports free shipping and flat rate choices', () => {
  assert.deepEqual(calculateShippingCharge({ shippingCostType: 'free' }, { subtotal: 20, quantity: 1, lines: [] }), { shippingTotal: 0 })
  assert.deepEqual(calculateShippingCharge({ shippingCostType: 'flat', flatShippingRate: 4.5 }, { subtotal: 20, quantity: 1, lines: [] }), { shippingTotal: 4.5 })
  assert.deepEqual(calculateShippingCharge({ shippingCostType: 'flat' }, { subtotal: 20, quantity: 1, lines: [] }), { shippingTotal: 0 })
})

test('supports price, weight, and item count rate ranges', () => {
  const lines = [{ product: { shippingWeight: 0.2 }, quantity: 2 }]
  assert.deepEqual(calculateShippingCharge({ shippingCostType: 'price', shippingTiers: [{ minimumSubtotal: 10, maximumSubtotal: 30, fee: 5 }] }, { subtotal: 20, quantity: 2, lines }), { shippingTotal: 5 })
  assert.deepEqual(calculateShippingCharge({ shippingCostType: 'weight', shippingTiers: [{ minimumWeightKg: 0.3, maximumWeightKg: 0.5, fee: 6 }] }, { subtotal: 20, quantity: 2, lines }), { shippingTotal: 6 })
  assert.deepEqual(calculateShippingCharge({ shippingCostType: 'items', shippingTiers: [{ minimumItems: 2, maximumItems: 4, fee: 7 }] }, { subtotal: 20, quantity: 2, lines }), { shippingTotal: 7 })
})

test('advanced cost rows match both selected dimensions', () => {
  const tier = { minimumSubtotal: 10, maximumSubtotal: 30, minimumWeightKg: 0.3, maximumWeightKg: 0.5, fee: 8 }
  assert.equal(findShippingTier([tier], {
    type: 'advanced', primaryDimension: 'price', secondaryDimension: 'weight',
    values: { price: 20, weight: 0.4, items: 1 },
  }), tier)
  assert.equal(findShippingTier([tier], {
    type: 'advanced', primaryDimension: 'price', secondaryDimension: 'weight',
    values: { price: 20, weight: 0.6, items: 1 },
  }), undefined)
})

test('applies order value conditions before the selected rate type', () => {
  assert.deepEqual(calculateShippingCharge({
    minimumOrderValue: 20,
    freeShippingThreshold: 50,
    shippingCostType: 'flat',
    flatShippingRate: 5,
  }, { subtotal: 15, quantity: 1, lines: [] }), { unavailable: true, reason: 'minimum-order-value' })
  assert.deepEqual(calculateShippingCharge({
    freeShippingThreshold: 50,
    shippingCostType: 'flat',
    flatShippingRate: 5,
  }, { subtotal: 50, quantity: 1, lines: [] }), { shippingTotal: 0 })
})

test('does not silently charge zero when a cart has no matching rate range', () => {
  assert.deepEqual(calculateShippingCharge({
    freeShippingThreshold: null,
    shippingCostType: 'weight',
    shippingTiers: [{ maximumWeightKg: 0.3, fee: 5 }],
  }, { subtotal: 20, quantity: 1, lines: [{ product: { shippingWeight: 0.4 }, quantity: 1 }] }), { unavailable: true, reason: 'no-matching-rate' })
})

test('keeps the previous range behavior for settings without a selected shipping type', () => {
  const tier = { minimumSubtotal: 10, maximumItems: 3, fee: 8 }
  assert.deepEqual(calculateShippingCharge({
    freeShippingThreshold: 50,
    flatShippingRate: 4,
    shippingTiers: [tier],
  }, { subtotal: 20, quantity: 2, lines: [] }), { shippingTotal: 8 })
})
