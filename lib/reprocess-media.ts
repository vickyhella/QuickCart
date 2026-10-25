import { readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import heicConvert from 'heic-convert'
import { uniqueOriginalFilename } from './media-filenames'
import { getEnvironmentVariable } from './environment-config'

export class ReprocessMediaError extends Error {
  status = 409
}

async function readStoredImage(collection: 'media' | 'media-originals', doc: any): Promise<Buffer> {
  const publicURL = getEnvironmentVariable('R2_PUBLIC_URL')?.replace(/\/$/, '')
  const url = String(doc.url || '')
  if (publicURL && url.startsWith(`${publicURL}/`)) {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Could not read the stored image (HTTP ${response.status}).`)
    return Buffer.from(await response.arrayBuffer())
  }
  const filename = path.basename(String(doc.filename || ''))
  if (!filename) throw new Error('The source image has no filename.')
  return readFile(path.join(process.cwd(), 'public', collection, filename))
}

function isStaticRaster(image: any) {
  const mime = String(image?.mimeType || '').toLowerCase()
  const filename = String(image?.filename || '')
  return mime.startsWith('image/') && !['image/gif', 'image/svg+xml', 'image/apng', 'image/heic-sequence', 'image/heif-sequence'].includes(mime) && !/\.(gif|svg|apng)$/i.test(filename)
}

export function hasReprocessableSource(media: any) {
  const original = media?.sourceOriginal && typeof media.sourceOriginal === 'object' ? media.sourceOriginal : null
  if (original) return isStaticRaster(original)
  const mime = String(media?.mimeType || '').toLowerCase()
  const filename = String(media?.filename || '')
  return isStaticRaster(media) && mime !== 'image/webp' && !/\.webp$/i.test(filename)
}

export async function reprocessMediaFromOriginal(payload: any, id: string) {
  let newlyCreatedOriginalID: string | number | undefined
  try {
    const media = await payload.findByID({ collection: 'media', id, depth: 0, overrideAccess: true })
    const linkedSource = media.sourceOriginal && typeof media.sourceOriginal === 'object'
      ? media.sourceOriginal
      : media.sourceOriginal ? await payload.findByID({ collection: 'media-originals', id: media.sourceOriginal, depth: 0, overrideAccess: true }) : null
    if (!hasReprocessableSource({ ...media, sourceOriginal: linkedSource })) throw new ReprocessMediaError('This image has no supported static original to reprocess.')

    const source = linkedSource || media
    const sourceCollection = linkedSource ? 'media-originals' : 'media'
    const sourceData = await readStoredImage(sourceCollection, source)
    const sourceMime = String(source.mimeType || '').toLowerCase()
    const sourceName = String(source.filename || '')
    const isHEIC = ['image/heic', 'image/heif'].includes(sourceMime) || /\.(heic|heif)$/i.test(sourceName)
    const webpInput = isHEIC ? Buffer.from(await heicConvert({ buffer: sourceData, format: 'JPEG', quality: 1 })) : sourceData
    const sourceMetadata = await sharp(webpInput).metadata()
    if (!sourceMetadata.width || !sourceMetadata.height) throw new Error('The source image could not be decoded into a visible picture.')
    if ((sourceMetadata.pages || 1) > 1) throw new ReprocessMediaError('Animated images are preserved as uploaded and are not batch-recompressed.')

    const marketing = await payload.findGlobal({ slug: 'marketing-settings', depth: 0, overrideAccess: true })
    const quality = Math.max(1, Math.min(100, Number(marketing.webpQuality || 82)))
    const webp = await sharp(webpInput).rotate().webp({ quality }).toBuffer()
    const outputMetadata = await sharp(webp).metadata()
    if (!outputMetadata.width || !outputMetadata.height || webp.length < 100) throw new Error('The converted WebP image is empty.')

    const currentName = String(media.filename || '')
    const outputName = currentName.replace(/\.(jpe?g|png|heic|heif|webp)$/i, '.webp') || `image-${id}.webp`

    let originalID = linkedSource?.id
    if (!originalID) {
      const originalFilename = await uniqueOriginalFilename(payload, outputName, sourceName)
      const original = await payload.create({
        collection: 'media-originals',
        data: { title: `Original source: ${outputName}` },
        file: { data: sourceData, mimetype: sourceMime || 'application/octet-stream', name: originalFilename, size: sourceData.length },
        overrideAccess: true,
      })
      originalID = original.id
      newlyCreatedOriginalID = original.id
    }

    const updated = await payload.update({
      collection: 'media', id,
      data: { sourceOriginal: originalID },
      file: { data: webp, mimetype: 'image/webp', name: outputName, size: webp.length },
      context: { skipMediaOptimization: true },
      overrideAccess: true,
    })
    return { quality, doc: updated }
  } catch (error) {
    if (newlyCreatedOriginalID !== undefined) await payload.delete({ collection: 'media-originals', id: newlyCreatedOriginalID, overrideAccess: true }).catch(() => undefined)
    throw error
  }
}
