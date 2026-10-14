import assert from 'node:assert/strict'
import test from 'node:test'
import { uniqueOriginalFilename } from '../lib/media-filenames'

test('names the source image after the optimized image with an original suffix', async () => {
  const payload = { find: async () => ({ docs: [] }) }
  assert.equal(await uniqueOriginalFilename(payload, 'rosewater-01.webp', 'camera-photo.JPEG'), 'rosewater-01-original.jpeg')
})

test('uses a unique suffix rather than overwriting a still-linked original', async () => {
  const payload = { find: async ({ where }: { where: { filename: { equals: string } } }) => ({ docs: where.filename.equals === 'rosewater-01-original.png' ? [{}] : [] }) }
  assert.equal(await uniqueOriginalFilename(payload, 'rosewater-01.webp', 'camera-photo.png'), 'rosewater-01-original-02.png')
})
