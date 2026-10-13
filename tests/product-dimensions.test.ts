import assert from 'node:assert/strict'
import test from 'node:test'
import { productCardDimensions, productDimensionValues, productMatchesDimension, uniqueLengthShapePairs } from '../lib/product-dimensions'
import { renderStudioDescription } from '../lib/studio-description-template'

test('keeps explicitly selected length and shape pairs without creating cross-pairs', () => {
  assert.deepEqual(uniqueLengthShapePairs([
    { length: 'short', shape: 'square' },
    { length: 'long', shape: 'oval' },
    { length: 'short', shape: 'square' },
  ]), [
    { length: 'short', shape: 'square' },
    { length: 'long', shape: 'oval' },
  ])
})

test('derives filters only from enabled variants when variants exist', () => {
  const products = [{ length: 'short, long', variants: [{ length: 'short' }, { length: 'long', enabled: false }] }]
  assert.deepEqual(productDimensionValues(products, 'length'), ['short'])
  assert.equal(productMatchesDimension(products[0], 'length', 'long'), false)
})

test('falls back to product dimensions for legacy products without variants', () => {
  const product = { shape: 'square, almond' }
  assert.deepEqual(productDimensionValues([product], 'shape'), ['square', 'almond'])
  assert.equal(productMatchesDimension(product, 'shape', 'almond'), true)
})

test('does not fall back to stale product dimensions when all variants are disabled', () => {
  const product = { length: 'short', variants: [{ length: 'short', enabled: false }] }
  assert.deepEqual(productDimensionValues([product], 'length'), [])
  assert.equal(productMatchesDimension(product, 'length', 'short'), false)
})

test('shows unique enabled variant shapes on product cards', () => {
  assert.deepEqual(productCardDimensions({
    length: 'long', shape: 'coffin',
    variants: [{ shape: 'square' }, { shape: 'square' }, { shape: 'almond' }, { shape: 'coffin', enabled: false }],
  }), ['square', 'almond'])
  assert.deepEqual(productCardDimensions({ variants: [{ length: 'short', enabled: false }] }), [])
})

test('renders description templates and removes rows with unavailable dimensions', () => {
  assert.equal(renderStudioDescription('**{productName}**\n\nSizes: {availableSizes}\n\nShapes: {shape}', {
    productName: 'Summer', availableSizes: '', shape: 'Square, Almond',
  }), '**Summer**\n\nShapes: Square, Almond')
})
