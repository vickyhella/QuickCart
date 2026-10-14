import test from 'node:test'
import assert from 'node:assert/strict'
import { Media } from '../collections/Media'
import { getPublishedProductMediaIDs } from '../lib/public-product-media'

test('collects unique media IDs from product image relationships', () => {
  assert.deepEqual(getPublishedProductMediaIDs([
    { featuredImage: 19, gallery: [{ id: 20 }, 21], variants: [{ image: 22 }, { image: 19 }] },
    { featuredImage: '23', gallery: [null, undefined] },
  ]), ['19', '20', '21', '22', '23'])
})

test('public media reads are restricted to images used by published products', async () => {
  const read = Media.access?.read
  assert.equal(typeof read, 'function')
  const result = await (read as Function)({
    req: {
      user: null,
      payload: {
        find: async (query: Record<string, unknown>) => {
          assert.deepEqual(query.where, { status: { equals: 'published' } })
          assert.equal(query.overrideAccess, true)
          return { docs: [{ featuredImage: 19, gallery: [20], variants: [{ image: 21 }] }] }
        },
      },
    },
  })
  assert.deepEqual(result, { id: { in: ['19', '20', '21'] } })
})
