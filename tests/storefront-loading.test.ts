import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fetchStorefrontJSON } from '../lib/storefront-request.js'
import { normalizeStorefrontImageSource } from '../lib/storefront-image.js'
import { toStorefrontSummary } from '../lib/storefront-product.js'

test('listing summaries omit long content but preserve the image fallback and purchasable variants', () => {
  const variants = [{ id: 's', size: 's', stock: 2, price: 15, attributes: { quantity: 2 } }]
  const summary = toStorefrontSummary({ id: 1, title: 'Nails', description: 'Long description', gallery: [{ url: '/nails.webp' }], variants, supplierNotes: 'private' })
  assert.equal('description' in summary, false)
  assert.equal('gallery' in summary, false)
  assert.equal('supplierNotes' in summary, false)
  assert.deepEqual(summary.featuredImage, { url: '/nails.webp' })
  assert.deepEqual(summary.variants, variants)
})

test('simultaneous catalogue requests are shared and a manual retry bypasses the browser cache', async () => {
  const original = globalThis.fetch
  const calls: string[] = []
  let release!: () => void
  globalThis.fetch = async (_url, options) => {
    calls.push(String(options?.cache))
    await new Promise<void>((resolve) => { release = resolve })
    return Response.json({ docs: [] })
  }
  try {
    const first = fetchStorefrontJSON('/catalogue-test')
    const second = fetchStorefrontJSON('/catalogue-test')
    assert.equal(first, second)
    release()
    await Promise.all([first, second])
    const retry = fetchStorefrontJSON('/catalogue-test', true)
    release()
    await retry
    assert.deepEqual(calls, ['default', 'reload'])
  } finally { globalThis.fetch = original }
})

test('a failed catalogue request is not kept as a permanent failed promise', async () => {
  const original = globalThis.fetch
  let attempts = 0
  globalThis.fetch = async () => ++attempts === 1 ? new Response('', { status: 503 }) : Response.json({ docs: [] })
  try {
    await assert.rejects(fetchStorefrontJSON('/failure-test'), /Could not load/)
    assert.deepEqual(await fetchStorefrontJSON('/failure-test'), { docs: [] })
    assert.equal(attempts, 2)
  } finally { globalThis.fetch = original }
})


test('local Payload image sources skip the redirect that breaks the optimizer', () => {
  assert.equal(normalizeStorefrontImageSource('/api/media/file/nails.webp/'), '/api/media/file/nails.webp')
  assert.equal(normalizeStorefrontImageSource('/api/media/file/nails.webp/?v=1'), '/api/media/file/nails.webp?v=1')
  assert.equal(normalizeStorefrontImageSource('https://cdn.example/nails.webp/'), 'https://cdn.example/nails.webp/')
  assert.equal(normalizeStorefrontImageSource('/site/hero.webp'), '/site/hero.webp')
})
