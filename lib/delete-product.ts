import type { Payload } from 'payload'

const relationID = (value: any) =>
  String(value && typeof value === 'object' ? value.id : (value ?? ''))

export function isMediaReferencedByProducts(products: any[], mediaID: string) {
  return products.some(
    (item) =>
      relationID(item.featuredImage) === mediaID ||
      (Array.isArray(item.gallery) &&
        item.gallery.some((image: any) => relationID(image) === mediaID)) ||
      (Array.isArray(item.variants) &&
        item.variants.some(
          (variant: any) => relationID(variant.image) === mediaID,
        )),
  )
}

export async function deleteProduct(
  payload: Payload,
  id: string,
  force: boolean,
) {
  const product: any = await payload.findByID({
    collection: 'products',
    id,
    depth: 0,
    overrideAccess: true,
  })
  const [orders, pins, ownedMedia] = await Promise.all([
    payload.find({
      collection: 'orders',
      where: { 'items.product': { equals: id } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'pinterest-posts',
      where: { product: { equals: id } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'media',
      where: { product: { equals: id } },
      limit: 10000,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    }),
  ])
  const referenceCount = orders.totalDocs + pins.totalDocs
  const references = {
    orders: orders.totalDocs,
    pinterestPosts: pins.totalDocs,
    media: ownedMedia.totalDocs,
  }
  if (referenceCount && !force)
    return { requiresForce: true as const, referenceCount, references }

  const mediaIDs = new Set<string>(
    [
      ...ownedMedia.docs.map((media: any) => String(media.id)),
      relationID(product.featuredImage),
      ...(Array.isArray(product.gallery)
        ? product.gallery.map(relationID)
        : []),
      ...(Array.isArray(product.variants)
        ? product.variants.map((variant: any) => relationID(variant.image))
        : []),
    ].filter(Boolean),
  )

  await payload.delete({ collection: 'products', id, overrideAccess: true })

  let deletedMedia = 0
  let deletedOriginals = 0
  let keptReferencedMedia = 0
  let cleanupFailures = 0
  for (const mediaID of mediaIDs) {
    try {
      const media: any = await payload.findByID({
        collection: 'media',
        id: mediaID,
        depth: 0,
        overrideAccess: true,
      })
      if (!media) continue
      const [products, pinImages] = await Promise.all([
        // shortcut: the reference scan is capped at 10,000 products; paginate if the catalog approaches that size.
        payload.find({
          collection: 'products',
          limit: 10000,
          pagination: false,
          depth: 0,
          overrideAccess: true,
        }),
        payload.find({
          collection: 'pinterest-posts',
          where: {
            or: [
              { imageMedia: { equals: mediaID } },
              ...(media.url ? [{ imageURL: { equals: media.url } }] : []),
            ],
          },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        }),
      ])
      const usedByProduct = isMediaReferencedByProducts(
        products.docs as any[],
        mediaID,
      )
      if (usedByProduct || pinImages.totalDocs) {
        keptReferencedMedia++
        continue
      }

      if (relationID(media.product) && relationID(media.product) !== id) {
        keptReferencedMedia++
        continue
      }
      const originalID = relationID(media.sourceOriginal)
      await payload.delete({
        collection: 'media',
        id: mediaID,
        overrideAccess: true,
      })
      deletedMedia++
      if (originalID) {
        const otherMedia = await payload.find({
          collection: 'media',
          where: { sourceOriginal: { equals: originalID } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        if (!otherMedia.totalDocs) {
          await payload.delete({
            collection: 'media-originals',
            id: originalID,
            overrideAccess: true,
          })
          deletedOriginals++
        }
      }
    } catch {
      cleanupFailures++
    }
  }
  return {
    success: true as const,
    referenceCount,
    references,
    deletedMedia,
    deletedOriginals,
    keptReferencedMedia,
    cleanupFailures,
  }
}
