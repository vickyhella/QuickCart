import assert from 'node:assert/strict'
import test from 'node:test'
import { matchesProductBulkFilters } from '../lib/product-bulk-filters'

const filters = { status: '', category: '', shape: '', length: '', color: '', brand: '' }
const row = { title: 'Rosewater', chineseName: '玫瑰水', sku: '1001', status: 'published', category: 'press-on-nails', shape: 'square, almond', length: 'x-short, short', color: 'pink', brand: 'Ginny Nana' }

test('dimension filters match whole comma-separated values', () => {
  assert.equal(matchesProductBulkFilters(row, '', { ...filters, length: 'short' }), true)
  assert.equal(matchesProductBulkFilters(row, '', { ...filters, length: 'x-short' }), true)
  assert.equal(matchesProductBulkFilters({ ...row, length: 'x-short' }, '', { ...filters, length: 'short' }), false)
  assert.equal(matchesProductBulkFilters(row, '', { ...filters, shape: 'oval' }), false)
})

test('search includes the internal Chinese product name', () => {
  assert.equal(matchesProductBulkFilters(row, '玫瑰', filters), true)
})
