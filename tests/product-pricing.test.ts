import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getPriceDetails, toEditorPriceFields, toStoredPriceFields } from '../lib/product-pricing.js'

test('uses regular price when no sale price is set', () => {
  assert.deepEqual(getPriceDetails({ price: 28 }), {
    price: 28,
    salePrice: null,
    currentPrice: 28,
    onSale: false,
  })
})

test('maps legacy selling and compare-at prices to GMC without reversing the charge', () => {
  assert.deepEqual(getPriceDetails({ price: 22, compareAtPrice: 28 }), {
    price: 28,
    salePrice: 22,
    currentPrice: 22,
    onSale: true,
  })
  assert.equal(getPriceDetails({ price: 22, compareAtPrice: 18 }).currentPrice, 22)
  assert.equal(getPriceDetails({ price: 22, compareAtPrice: 18 }).salePrice, null)
})

test('an explicit variant charge is never replaced by the product sale price', () => {
  assert.deepEqual(getPriceDetails({ price: 22, compareAtPrice: 28 }, { price: 25 }), {
    price: 28,
    salePrice: 25,
    currentPrice: 25,
    onSale: true,
  })
  assert.equal(getPriceDetails({ price: 22, compareAtPrice: 28 }, { price: 30 }).currentPrice, 30)
  assert.equal(getPriceDetails({ price: 22, compareAtPrice: 28 }, { price: null }).currentPrice, 22)
})

test('writes the editor pair to existing fields and clears a removed sale', () => {
  assert.deepEqual(toStoredPriceFields({ price: 30, salePrice: 25 }), { price: 25, compareAtPrice: 30 })
  assert.deepEqual(toStoredPriceFields({ price: 30, salePrice: '' }), { price: 30, compareAtPrice: null })
  assert.deepEqual(toStoredPriceFields({ price: 30, salePrice: 0 }), { price: 0, compareAtPrice: 30 })
  assert.throws(() => toStoredPriceFields({ price: 30, salePrice: 30 }), /lower than/)
  assert.throws(() => toStoredPriceFields({ salePrice: 25 }), /lower than/)
  assert.throws(() => toStoredPriceFields({ price: 'NaN' }), /valid/)
  assert.throws(() => toStoredPriceFields({ price: -1 }), /valid/)
  assert.deepEqual(toStoredPriceFields({ price: null, salePrice: 21 }, undefined, { price: 25, compareAtPrice: 30 }), { price: 21, compareAtPrice: 30 })
})

test('no-op edits preserve raw variant inheritance, overrides and all actual charges', () => {
  for (const productPrice of [0, 19.9, 25, 30]) {
    for (const productCompare of [null, 20, 30, 40]) {
      const product = { price: productPrice, compareAtPrice: productCompare }
      assert.deepEqual(toStoredPriceFields(toEditorPriceFields(product), product), product)
      for (const variantPrice of [null, 0, 21, 35]) {
        for (const variantCompare of [null, 20, 30, 40]) {
          const variant = { price: variantPrice, compareAtPrice: variantCompare }
          const stored = toStoredPriceFields(toEditorPriceFields(variant, product), variant, product)
          assert.deepEqual(stored, variant)
          assert.equal(getPriceDetails(product, stored).currentPrice, variantPrice ?? productPrice)
        }
      }
    }
  }
})

test('an explicit regular variant price remains regular under a discounted product', () => {
  const product = { price: 25, compareAtPrice: 30 }
  const variant = toStoredPriceFields({ price: 20, salePrice: null }, undefined, product)
  assert.deepEqual(toEditorPriceFields(variant, product), { price: 20, salePrice: null })
  assert.equal(getPriceDetails(product, variant).currentPrice, 20)
})
