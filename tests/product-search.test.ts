import assert from 'node:assert/strict'
import { test } from 'node:test'
import { productSearchURL } from '../lib/product-search.js'
import { toStorefrontProduct } from '../lib/storefront-product.js'

test('name search always queries published products and supports pagination beyond the homepage', () => {
  const url = new URL(productSearchURL('  Rose & Tea  ', 6), 'https://shop.example')
  assert.equal(url.pathname, '/api/products')
  assert.equal(url.searchParams.get('where[status][equals]'), 'published')
  assert.equal(url.searchParams.get('where[title][contains]'), 'Rose & Tea')
  assert.equal(url.searchParams.get('page'), '6')
  assert.equal(url.searchParams.get('limit'), '24')
  assert.equal(new URL(productSearchURL('x'.repeat(200), -4), url).searchParams.get('where[title][contains]')?.length, 160)
})

test('search and homepage cards share image order with corresponding alt text', () => {
  const card = toStorefrontProduct({ id: 4, title: 'Rose', featuredImage: null, gallery: [null, 2, { url: '/rose.webp', altText: 'Rose nails' }] })
  assert.equal(card._id, '4')
  assert.equal(card.name, 'Rose')
  assert.deepEqual(card.image, ['/rose.webp'])
  assert.deepEqual(card.imageAlt, ['Rose nails'])
  assert.deepEqual(toStorefrontProduct({ id: 5, title: 'Tea' }).image, ['/nail-placeholder.svg'])
})
