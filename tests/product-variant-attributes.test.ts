import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateProductVariantAttributes } from '../lib/product-variant-attributes.js'

const dimensions = [
  { key: 'quantity', label: 'Quantity', valueType: 'integer' },
  { key: 'color', label: 'Color', valueType: 'text' },
]

test('accepts integer and text variant attributes', () => {
  assert.deepEqual(validateProductVariantAttributes({ quantity: 4, color: 'nude' }, dimensions), { quantity: 4, color: 'nude' })
})

test('rejects non-integer quantity, blank text, and unknown dimensions', () => {
  assert.throws(() => validateProductVariantAttributes({ quantity: 2.5 }, dimensions), /positive whole number/)
  assert.throws(() => validateProductVariantAttributes({ color: ' ' }, dimensions), /must be text/)
  assert.throws(() => validateProductVariantAttributes({ shade: 'nude' }, dimensions), /Unknown variant dimension/)
})
