import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mergeProductVariants } from '../lib/merge-product-variants.js'

test('restores selected variants by combination and disables removed variants without losing identity or stock', () => {
  const result = mergeProductVariants([
    { id: 'existing-1', sku: '1001-03-03-02', length: 'medium', shape: 'almond', size: 's', stock: 4, enabled: false, supplierSKU: 'SUP-1' },
    { id: 'existing-2', sku: '1001-02-01-03', length: 'short', shape: 'square', size: 'm', stock: 7, enabled: true },
  ], [
    { length: 'medium', shape: 'almond', size: 's', stock: 6, enabled: true, price: null, image: null },
  ])

  assert.deepEqual(result, [
    { id: 'existing-1', sku: '1001-03-03-02', length: 'medium', shape: 'almond', size: 's', stock: 6, enabled: true, supplierSKU: 'SUP-1', price: null, image: null },
    { id: 'existing-2', sku: '1001-02-01-03', length: 'short', shape: 'square', size: 'm', stock: 7, enabled: false },
  ])
})
