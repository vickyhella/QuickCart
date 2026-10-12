import assert from 'node:assert/strict'
import { test } from 'node:test'
import sharp from 'sharp'
import { prepareMediaUpload } from '../lib/prepare-media-upload.js'

function asFile(name: string, type: string, data: Buffer): File {
  return new File([new Uint8Array(data) as BlobPart], name, { type })
}

test('converts JPEG/PNG source bytes to a WebP and preserves the exact original', async () => {
  const source = await sharp({ create: { width: 24, height: 18, channels: 3, background: '#a64b72' } }).png().toBuffer()
  const prepared = await prepareMediaUpload(asFile('Sample Product.PNG', 'image/png', source), 78)

  assert.equal(prepared.outputMimeType, 'image/webp')
  assert.equal(prepared.outputName, 'Sample Product.webp')
  assert.deepEqual(prepared.original, source)
  assert.deepEqual(await sharp(prepared.output).metadata().then(({ format }) => format), 'webp')
})

test('keeps existing WebP bytes without re-encoding', async () => {
  const source = await sharp({ create: { width: 16, height: 16, channels: 3, background: '#243f5a' } }).webp({ quality: 80 }).toBuffer()
  const prepared = await prepareMediaUpload(asFile('Already.webp', 'image/webp', source), 40)

  assert.equal(prepared.outputMimeType, 'image/webp')
  assert.deepEqual(prepared.output, source)
  assert.deepEqual(prepared.original, source)
})

test('rejects an invalid HEIC source without creating or replacing any records', async () => {
  await assert.rejects(
    prepareMediaUpload(asFile('broken.heic', 'image/heic', Buffer.from('not an image')), 82),
    /HEIC\/HEIF image could not be decoded|visible picture/i,
  )
})

test('preserves animated GIF input instead of flattening it into WebP', async () => {
  const source = Buffer.from('GIF89a')
  const prepared = await prepareMediaUpload(asFile('animation.gif', 'image/gif', source), 82)

  assert.equal(prepared.outputMimeType, 'image/gif')
  assert.deepEqual(prepared.output, source)
})
