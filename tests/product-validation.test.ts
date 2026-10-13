import assert from 'node:assert/strict'
import { test } from 'node:test'
import { productPublishError } from '../lib/product-validation.js'

const validProduct = {
  title: 'Rosewater', price: 28, hasImage: true,
  variants: [{ length: 'medium', shape: 'almond', size: 's', enabled: true, stock: 1 }],
}

test('allows publishing a complete product', () => {
  assert.equal(productPublishError(validProduct), null)
})

test('rejects publishing when every enabled variant is out of stock', () => {
  assert.match(productPublishError({ ...validProduct, variants: [{ ...validProduct.variants[0], stock: 0 }] }) || '', /enabled in-stock variant/)
})

test('rejects publishing without an image or a valid base price', () => {
  assert.ok(productPublishError({ ...validProduct, hasImage: false }))
  assert.ok(productPublishError({ ...validProduct, price: -1 }))
})
