import assert from 'node:assert/strict'
import test from 'node:test'
import { getMediaUsage } from '../lib/original-media-cleanup'
import { deleteUnusedMedia } from '../lib/unused-media-cleanup'

const relationID = (value: any) => String(value && typeof value === 'object' ? value.id : value ?? '')
const matches = (record: any, where: any): boolean => {
  if (where.or) return where.or.some((clause: any) => matches(record, clause))
  return Object.entries(where).every(([field, operator]: [string, any]) => {
    const values = field === 'variants.image' ? record.variants?.map((variant: any) => variant.image) || [] : [record[field]].flat()
    return values.some((value: any) => relationID(value) === String(operator.equals ?? operator.contains))
  })
}

function mockPayload({ media = [], products = [], pins = [], failMedia = '', failOriginal = '', newReference = false }: any = {}) {
  const deleted: string[] = []
  const rows = [...media]
  const payload = {
    find: async ({ collection, where }: any) => {
      const records = collection === 'media' ? rows : collection === 'products' ? products : pins
      if (newReference && collection === 'products' && where) return { docs: [{ id: 'new-reference' }] }
      return { docs: where ? records.filter((record: any) => matches(record, where)) : records }
    },
    findByID: async ({ id }: any) => rows.find((item: any) => String(item.id) === String(id)),
    delete: async ({ collection, id }: any) => {
      if ((collection === 'media' && String(id) === failMedia) || (collection === 'media-originals' && String(id) === failOriginal)) throw new Error('Storage unavailable')
      deleted.push(`${collection}:${id}`)
      if (collection === 'media') rows.splice(rows.findIndex((item: any) => String(item.id) === String(id)), 1)
    },
  }
  return { payload: payload as any, deleted }
}

test('media reference analysis protects all product slots, drafts, and Pins by ID or URL', () => {
  const media = Array.from({ length: 7 }, (_, index) => ({ id: index + 1, url: `https://cdn.test/${index + 1}.webp`, product: 99 }))
  const usage = getMediaUsage(media, [
    { id: 10, title: 'Draft', featuredImage: { id: 1 }, gallery: [2], variants: [{ image: { id: 3 } }] },
  ], [
    { id: 20, imageMedia: 4 }, { id: 21, imageURL: media[4].url },
    { id: 22, imageMedia: 4, imageURL: media[5].url },
  ])
  assert.deepEqual(usage.map((item) => item.referenced), [true, true, true, true, true, true, false])
})

test('bulk cleanup deletes unused media and associated originals after all media deletions', async () => {
  const { payload, deleted } = mockPayload({ media: [
    { id: 1, sourceOriginal: 11 }, { id: 2, sourceOriginal: { id: 11 } }, { id: 3, sourceOriginal: null },
  ] })
  const result = await deleteUnusedMedia(payload)
  assert.equal(result.deleted, 3)
  assert.equal(result.deletedOriginals, 1)
  assert.deepEqual(deleted, ['media:1', 'media:2', 'media:3', 'media-originals:11'])
  assert.deepEqual(result.failures, [])
})

test('referenced images and shared originals remain while other images are deleted', async () => {
  const { payload, deleted } = mockPayload({
    media: [{ id: 1, sourceOriginal: 11 }, { id: 2, sourceOriginal: 11 }, { id: 3, sourceOriginal: 12 }],
    products: [{ id: 10, featuredImage: 1 }],
  })
  const result = await deleteUnusedMedia(payload)
  assert.deepEqual(deleted, ['media:2', 'media:3', 'media-originals:12'])
  assert.equal(result.keptReferenced, 1)
  assert.equal(result.keptSharedOriginals, 1)
})

test('references added since analysis are rechecked before deletion', async () => {
  const { payload, deleted } = mockPayload({ media: [{ id: 1, sourceOriginal: 11 }], newReference: true })
  const result = await deleteUnusedMedia(payload)
  assert.deepEqual(deleted, [])
  assert.equal(result.keptReferenced, 1)
})

test('failed media deletion keeps its original and does not stop other media cleanup', async () => {
  const { payload, deleted } = mockPayload({ media: [{ id: 1, sourceOriginal: 11 }, { id: 2, sourceOriginal: 11 }], failMedia: '1' })
  const result = await deleteUnusedMedia(payload)
  assert.deepEqual(deleted, ['media:2'])
  assert.equal(result.keptSharedOriginals, 1)
  assert.equal(result.failures.length, 1)
})

test('original deletion failure is reported accurately without claiming it was deleted', async () => {
  const { payload, deleted } = mockPayload({ media: [{ id: 1, sourceOriginal: 11 }], failOriginal: '11' })
  const result = await deleteUnusedMedia(payload)
  assert.deepEqual(deleted, ['media:1'])
  assert.equal(result.deletedOriginals, 0)
  assert.match(result.failures[0], /Original 11: Storage unavailable/)
})
