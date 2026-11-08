import assert from 'node:assert/strict'
import { test } from 'node:test'
import { selectHomepageProducts } from '../lib/homepage-products'

const products = Array.from({ length: 8 }, (_, i) => ({ _id: String(i), slug: 'design-' + i }))
test('manual homepage picks preserve order, deduplicate and skip missing products', () => {
  const result = selectHomepageProducts(products, ['design-3', '1', 'missing', '3'])
  assert.deepEqual(result.products.map((p) => p._id), ['3', '1'])
  assert.equal(result.curated, true)
})
test('homepage limits picks to six and labels an unconfigured catalogue honestly', () => {
  assert.equal(selectHomepageProducts(products, products.map((p) => p._id)).products.length, 6)
  assert.equal(selectHomepageProducts(products).curated, false)
  assert.equal(selectHomepageProducts(products, ['missing']).curated, false)
  assert.deepEqual(selectHomepageProducts([]).products, [])
})
