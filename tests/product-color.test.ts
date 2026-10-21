import assert from 'node:assert/strict'
import test from 'node:test'
import { getProductColor, matchesProductColor, productVariantAttributeKeys, withoutProductColorVariantAttribute } from '../lib/product-color'

test('uses product color and migrates a consistent legacy variant color for display', () => {
  assert.equal(getProductColor({ color: 'Rose Pink', variants: [{ attributes: { color: 'nude' } }] }), 'Rose Pink')
  assert.equal(getProductColor({ variants: [{ attributes: { color: 'nude' } }, { attributes: { color: 'nude' } }] }), 'nude')
  assert.equal(getProductColor({ variants: [{ attributes: { color: 'nude' } }, { attributes: { color: 'pink' } }] }), '')
})

test('color is excluded from variant selectors and product color filters match product-level values', () => {
  const variants = [{ attributes: { color: 'nude', quantity: 4 } }, { attributes: { quantity: 8 } }]
  assert.deepEqual(productVariantAttributeKeys(variants), ['quantity'])
  assert.deepEqual(withoutProductColorVariantAttribute({ Color: 'nude', quantity: 4 }), { quantity: 4 })
  assert.equal(matchesProductColor({ color: 'Rose Pink' }, 'Rose Pink'), true)
  assert.equal(matchesProductColor({ variants: [{ attributes: { color: 'nude' } }] }, 'nude'), true)
  assert.equal(matchesProductColor({ color: 'Rose Pink' }, 'nude'), false)
})
