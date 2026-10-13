import assert from 'node:assert/strict'
import test from 'node:test'
import { pinterestProductLink } from '../lib/pinterest-product-link'

test('builds an absolute product link and selects the scheduled variant', () => {
  assert.equal(
    pinterestProductLink({ id: 12, slug: 'rosewater' }, 'variant 2', '', 'https://shop.example/'),
    'https://shop.example/product/rosewater?variant=variant%202',
  )
})

test('upgrades a stored relative link to an absolute storefront URL', () => {
  assert.equal(
    pinterestProductLink({ id: 12, slug: 'rosewater' }, null, '/product/rosewater', 'https://shop.example'),
    'https://shop.example/product/rosewater',
  )
})

test('uses the public storefront instead of a local development URL', () => {
  assert.equal(
    pinterestProductLink({ id: 12, slug: 'rosewater' }, null, '', 'http://localhost:3000'),
    'https://ginnynana.com/product/rosewater',
  )
})

test('preserves an explicitly provided external destination', () => {
  assert.equal(
    pinterestProductLink({ id: 12, slug: 'rosewater' }, null, 'https://campaign.example/landing', 'https://shop.example'),
    'https://campaign.example/landing',
  )
})
