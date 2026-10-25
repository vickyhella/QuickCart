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
        findGlobal: async () => ({}),
        find: async (query: Record<string, unknown>) => {
          assert.deepEqual(query.where, { status: { equals: 'published' } })
          assert.equal(query.overrideAccess, true)
          assert.equal(query.depth, 0)
          assert.deepEqual(query.select, { featuredImage: true, gallery: true, variants: { image: true } })
          return { docs: [{ featuredImage: 19, gallery: [20], variants: [{ image: 21 }] }] }
        },
      },
    },
  })
  assert.deepEqual(result, { id: { in: ['19', '20', '21'] } })
})

test('media access reuses one small lookup per request and includes configured homepage/category images', async () => {
  let reads = 0
  const req = { user: null, payload: {
    find: async () => { reads++; return { docs: [{ featuredImage: 1 }] } },
    findGlobal: async ({ slug }: any) => {
      reads++
      return slug === 'marketing-settings' ? { homepageHeroImage: 2, homepageMysteryBoxImage: 3 } : { dimensions: [{ key: '__category-preview-images', options: [{ image: 4 }] }] }
    },
  } }
  const read = Media.access!.read as Function
  const [first, second] = await Promise.all([read({ req }), read({ req })])
  assert.deepEqual(first, { id: { in: ['1', '2', '3', '4'] } })
  assert.deepEqual(second, first)
  assert.equal(reads, 3)
  await read({ req: { ...req } })
  assert.equal(reads, 6, 'A new request must reevaluate permissions rather than serving a stale public whitelist')
})
