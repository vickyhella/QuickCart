import assert from 'node:assert/strict'
import test from 'node:test'
import { hasReprocessableSource } from '../lib/reprocess-media'

test('includes media with a supported preserved original', () => {
  assert.equal(hasReprocessableSource({ mimeType: 'image/webp', filename: 'nails.webp', sourceOriginal: { mimeType: 'image/png', filename: 'nails.png' } }), true)
})

test('includes legacy static images but excludes WebP without an original', () => {
  assert.equal(hasReprocessableSource({ mimeType: 'image/jpeg', filename: 'legacy.jpg' }), true)
  assert.equal(hasReprocessableSource({ mimeType: 'image/webp', filename: 'no-source.webp' }), false)
})

test('excludes animated and vector originals from batch recompression', () => {
  assert.equal(hasReprocessableSource({ mimeType: 'image/gif', filename: 'animated.gif' }), false)
  assert.equal(hasReprocessableSource({ mimeType: 'image/svg+xml', filename: 'vector.svg' }), false)
})
