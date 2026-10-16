import assert from 'node:assert/strict'
import { test } from 'node:test'
import { productPublishError, storedProductPublishError } from '../lib/product-validation.js'

const validProduct = {
  title: 'Rosewater', price: 28, hasImage: true,
  variants: [{ length: 'medium', shape: 'almond', size: 's', enabled: true, stock: 1 }],
}

test('allows publishing a complete product', () => {
  assert.equal(productPublishError(validProduct), null)
})

test('rejects publishing when every enabled variant is out of stock', () => {
  assert.equal(productPublishError({ ...validProduct, variants: [{ ...validProduct.variants[0], stock: 0 }] }), 'To publish, enable at least one variant with available stock.')
})

test('rejects publishing without an image or a valid price', () => {
  assert.ok(productPublishError({ ...validProduct, hasImage: false }))
  assert.ok(productPublishError({ ...validProduct, price: -1 }))
})

test('allows publishing without an optional sale price', () => {
  assert.equal(productPublishError(validProduct), null)
})

test('allows publishing when sale price is below regular price', () => {
  assert.equal(productPublishError({ ...validProduct, price: 30, salePrice: 25 }), null)
})

test('Payload publishing accepts legacy discounts and independent variant selling prices', () => {
  assert.equal(storedProductPublishError({ ...validProduct, price: 22, compareAtPrice: 28, variants: [{ ...validProduct.variants[0], price: 35, compareAtPrice: null }] }), null)
})

test('rejects sale prices that are equal to or greater than the regular price', () => {
  assert.equal(productPublishError({ ...validProduct, salePrice: 28 }), 'To publish, Sale price must be lower than Price.')
  assert.equal(productPublishError({ ...validProduct, salePrice: 30 }), 'To publish, Sale price must be lower than Price.')
})

test('reports unavailable variants independently of valid sale pricing', () => {
  assert.equal(productPublishError({ ...validProduct, price: 30, salePrice: 25, variants: [{ ...validProduct.variants[0], stock: 0 }] }), 'To publish, enable at least one variant with available stock.')
})
