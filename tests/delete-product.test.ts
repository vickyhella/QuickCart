import test from 'node:test'
import assert from 'node:assert/strict'
import { isMediaReferencedByProducts } from '../lib/delete-product'

test('product media cleanup keeps images referenced by any product slot', () => {
  const product = {
    featuredImage: { id: 1 },
    gallery: [2],
    variants: [{ image: { id: 3 } }],
  }

  assert.equal(isMediaReferencedByProducts([product], '1'), true)
  assert.equal(isMediaReferencedByProducts([product], '2'), true)
  assert.equal(isMediaReferencedByProducts([product], '3'), true)
  assert.equal(isMediaReferencedByProducts([product], '4'), false)
})
