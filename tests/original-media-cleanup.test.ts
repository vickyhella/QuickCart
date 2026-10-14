import assert from 'node:assert/strict'
import test from 'node:test'
import { getOriginalUsage } from '../lib/original-media-cleanup'

test('marks originals as referenced only when their WebP is used by products or Pins', () => {
  const usage = getOriginalUsage(
    [{ id: 11, filename: 'used-original.jpg' }, { id: 12, filename: 'unused-original.png' }, { id: 13, filename: 'orphan-original.jpg' }],
    [
      { id: 21, sourceOriginal: 11, product: null, url: 'https://cdn.test/used.webp' },
      { id: 22, sourceOriginal: 12, product: 31, url: 'https://cdn.test/unused.webp' },
    ],
    [{ id: 31, title: 'French Tip', featuredImage: 21, gallery: [21], variants: [{ image: 21 }] }],
    [{ id: 41, title: 'French Tip Pin', imageMedia: 21, imageURL: 'https://cdn.test/used.webp' }],
  )

  assert.deepEqual(usage, [
    { id: 11, filename: 'used-original.jpg', webpCount: 1, productCount: 1, pinCount: 1, products: ['French Tip'], pins: ['French Tip Pin'], referenced: true },
    { id: 12, filename: 'unused-original.png', webpCount: 1, productCount: 0, pinCount: 0, products: [], pins: [], referenced: false },
    { id: 13, filename: 'orphan-original.jpg', webpCount: 0, productCount: 0, pinCount: 0, products: [], pins: [], referenced: false },
  ])
})
