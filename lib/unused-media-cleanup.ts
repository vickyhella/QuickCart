import type { Payload } from 'payload'
import { getMediaUsage } from './original-media-cleanup'

export async function inspectUnusedMedia(payload: Payload) {
  const [media, products, pins] = await Promise.all([
    payload.find({ collection: 'media', pagination: false, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'products', pagination: false, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'pinterest-posts', pagination: false, depth: 0, overrideAccess: true }),
  ])
  return getMediaUsage(media.docs, products.docs, pins.docs)
}

export async function deleteUnusedMedia(payload: Payload) {
  const usage = await inspectUnusedMedia(payload)
  let deleted = 0
  let deletedOriginals = 0
  let keptReferenced = usage.filter((item) => item.referenced).length
  const failures: string[] = []
  const originals = new Set<string>()

  for (const item of usage.filter((item) => !item.referenced)) {
    try {
      const media = await payload.findByID({ collection: 'media', id: item.id, depth: 0, overrideAccess: true })
      // Recheck current references; an earlier analysis must never authorize a stale deletion.
      const [products, pins] = await Promise.all([
        payload.find({ collection: 'products', where: { or: [
          { featuredImage: { equals: media.id } }, { gallery: { contains: media.id } }, { 'variants.image': { equals: media.id } },
        ] }, limit: 1, depth: 0, overrideAccess: true }),
        payload.find({ collection: 'pinterest-posts', where: { or: [
          { imageMedia: { equals: media.id } }, ...(media.url ? [{ imageURL: { equals: media.url } }] : []),
        ] }, limit: 1, depth: 0, overrideAccess: true }),
      ])
      if (products.docs.length || pins.docs.length) {
        keptReferenced++
        continue
      }
      const original = media.sourceOriginal && typeof media.sourceOriginal === 'object' ? media.sourceOriginal.id : media.sourceOriginal
      await payload.delete({ collection: 'media', id: media.id, overrideAccess: true })
      deleted++
      if (original != null) originals.add(String(original))
    } catch (error) {
      failures.push(`${item.filename}: ${error instanceof Error ? error.message : 'delete failed'}`)
    }
  }

  let keptSharedOriginals = 0
  for (const id of originals) {
    try {
      const linked = await payload.find({ collection: 'media', where: { sourceOriginal: { equals: id } }, limit: 1, depth: 0, overrideAccess: true })
      if (linked.docs.length) {
        keptSharedOriginals++
        continue
      }
      await payload.delete({ collection: 'media-originals', id, overrideAccess: true })
      deletedOriginals++
    } catch (error) {
      failures.push(`Original ${id}: ${error instanceof Error ? error.message : 'delete failed'}`)
    }
  }

  return { deleted, deletedOriginals, keptReferenced, keptSharedOriginals, failures }
}
