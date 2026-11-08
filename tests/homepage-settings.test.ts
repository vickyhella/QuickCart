import assert from 'node:assert/strict'
import { test } from 'node:test'
import homepage from '../config/homepage.json'
import { getAdminHomepageSettings } from '../lib/storefront-content'

test('repository homepage never reads Admin', async () => {
  const result = await getAdminHomepageSettings({ findGlobal: () => { throw new Error('Unexpected database query') } }, 'repository')
  assert.deepEqual(result, homepage)
})

test('Admin picks preserve order, normalize keys and keep repository-only sections', async () => {
  const result = await getAdminHomepageSettings({ findGlobal: async () => ({ homepageFeatured: {
    productKeys: [' design-a ', 'design-b', 'design-a', 3, '', 'c', 'd', 'e', 'f', 'g'], title: 'Our picks', description: 'Chosen for you',
  } }) }, 'admin')
  assert.deepEqual(result.featured, { productKeys: ['design-a', 'design-b', 'c', 'd', 'e', 'f'], title: 'Our picks', description: 'Chosen for you' })
  assert.deepEqual(result.discovery, homepage.discovery)
  assert.deepEqual(result.craft, homepage.craft)
})

test('missing Admin config falls back, while an explicit empty list clears picks', async () => {
  const missing = await getAdminHomepageSettings({ findGlobal: async () => ({}) }, 'admin')
  assert.deepEqual(missing.featured, homepage.featured)
  const empty = await getAdminHomepageSettings({ findGlobal: async () => ({ homepageFeatured: { productKeys: [], description: '' } }) }, 'admin')
  assert.deepEqual(empty.featured.productKeys, [])
  assert.equal(empty.featured.description, '')
})

test('Admin read failure returns a usable repository homepage', async () => {
  const result = await getAdminHomepageSettings({ findGlobal: async () => { throw new Error('Database unavailable') } }, 'admin')
  assert.deepEqual(result, homepage)
})
