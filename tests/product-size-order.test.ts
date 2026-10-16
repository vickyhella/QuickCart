import assert from 'node:assert/strict'
import { test } from 'node:test'
import { orderedVariantRows, sortProductSizes } from '../lib/product-size-order.js'

test('restoring M keeps the standard size order', () => {
  assert.deepEqual(sortProductSizes(['xs', 's', 'l', 'm']), ['xs', 's', 'm', 'l'])
  assert.deepEqual(sortProductSizes(['l', 'm', 's', 'xs']), ['xs', 's', 'm', 'l'])
})

test('variant cards remain ordered by size across multiple combinations', () => {
  const combinations = [{ length: 'short', shape: 'almond' }, { length: 'medium', shape: 'square' }]
  assert.deepEqual(orderedVariantRows(combinations, ['xs', 's', 'l', 'm']).map(({ combo, size }) => `${size}:${combo.length}`), [
    'xs:short', 'xs:medium', 's:short', 's:medium', 'm:short', 'm:medium', 'l:short', 'l:medium',
  ])
})
