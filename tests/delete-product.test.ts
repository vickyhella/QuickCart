import test from 'node:test'
import assert from 'node:assert/strict'
import { deleteProduct, isMediaReferencedByProducts } from '../lib/delete-product'

test('product media cleanup keeps images referenced by any product slot', () => {
  const product = {
    featuredImage: { id: 1 },
    gallery: [2],
    variants: [{ image: { id: 3 } }],
  }

  assert.equal(isMediaReferencedByProducts([product], '1'), true)
  assert.equal(isMediaReferencedByProducts([product], '2'), true)
  assert.equal(isMediaReferencedByProducts([product], '3'), true)
  assert.equal(isMediaReferencedByProducts([product], '4'), false)
})

for (const reference of ['id', 'url', 'unrelated'] as const) {
  test(`product deletion handles a Pinterest image reference by ${reference}`, async () => {
    const image = { id: 21, url: 'https://cdn.test/old-product-name.webp', sourceOriginal: 31 }
    const pin = {
      imageMedia: reference === 'id' ? 21 : null,
      imageURL: reference === 'url' ? image.url : 'https://cdn.test/another.webp',
    }
    const deleted: string[] = []
    const matches = (where: any): boolean =>
      where.imageMedia?.equals === String(pin.imageMedia) ||
      where.imageURL?.equals === pin.imageURL ||
      Boolean(where.or?.some(matches))
    const payload = {
      findByID: async ({ collection }: any) => collection === 'products'
        ? { id: 1, title: 'Renamed product', featuredImage: image.id }
        : image,
      find: async ({ collection, where }: any) => {
        const referenced = collection === 'pinterest-posts' && matches(where)
        return { docs: referenced ? [pin] : [], totalDocs: referenced ? 1 : 0 }
      },
      delete: async ({ collection }: any) => { deleted.push(collection) },
    }

    const result = await deleteProduct(payload as any, '1', false)

    assert.equal('keptReferencedMedia' in result && result.keptReferencedMedia, reference === 'unrelated' ? 0 : 1)
    assert.deepEqual(deleted, reference === 'unrelated' ? ['products', 'media', 'media-originals'] : ['products'])
  })
}
