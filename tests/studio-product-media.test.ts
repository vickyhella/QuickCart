import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveStudioProductMedia } from '../lib/studio-product-media'

test('keeps available WebP objects, maps legacy local URLs to R2, and excludes missing or non-WebP media', async () => {
  const result = await resolveStudioProductMedia([
    { id: 1, filename: 'dual-french-tip.webp', mimeType: 'image/webp', url: '/media/dual-french-tip.webp' },
    { id: 2, filename: 'dual-french-tip.webp', mimeType: 'image/webp', url: 'https://cdn.example.test/dual-french-tip.webp' },
    { id: 3, filename: 'dual-french-tip-original.jpg', mimeType: 'image/jpeg', url: '/media/dual-french-tip-original.jpg' },
    { id: 4, filename: 'deleted.webp', mimeType: 'image/webp', url: 'https://cdn.example.test/deleted.webp' },
  ], {
    r2PublicURL: 'https://cdn.example.test',
    requestURL: 'http://localhost:3000/api/studio/products/1',
    fetcher: async (url) => new Response(null, { status: String(url).endsWith('/deleted.webp') ? 404 : 200 }),
  })

  assert.deepEqual(result.media.map((media) => [media.id, media.url]), [[1, 'https://cdn.example.test/dual-french-tip.webp']])
  assert.equal(result.unavailableCount, 2)
})
