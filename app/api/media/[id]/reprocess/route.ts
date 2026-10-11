import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import sharp from 'sharp'
import heicConvert from 'heic-convert'
import config from '@/payload.config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function readStoredImage(collection: 'media' | 'media-originals', doc: any): Promise<Buffer> {
  const publicURL = process.env.R2_PUBLIC_URL?.replace(/\/$/, '')
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

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  try {
    const { id } = await context.params
    const media = await payload.findByID({ collection: 'media', id, depth: 1, overrideAccess: true })
    const linkedSource = media.sourceOriginal && typeof media.sourceOriginal === 'object' ? media.sourceOriginal : null
    const currentMime = String(media.mimeType || '').toLowerCase()
    const currentName = String(media.filename || '')
    if (!linkedSource && (currentMime === 'image/webp' || /\.webp$/i.test(currentName))) {
      return NextResponse.json({ error: 'This WebP has no preserved original, so it cannot be safely reprocessed.' }, { status: 409 })
    }

    const source = linkedSource || media
    const sourceCollection = linkedSource ? 'media-originals' : 'media'
    const sourceData = await readStoredImage(sourceCollection, source)
    const sourceMime = String(source.mimeType || '').toLowerCase()
    const sourceName = String(source.filename || '')
    const isHEIC = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'].includes(sourceMime) || /\.(heic|heif)$/i.test(sourceName)
    let webpInput = sourceData
    if (isHEIC) webpInput = Buffer.from(await heicConvert({ buffer: sourceData, format: 'JPEG', quality: 1 }))

    const sourceMetadata = await sharp(webpInput).metadata()
    if (!sourceMetadata.width || !sourceMetadata.height) throw new Error('The source image could not be decoded into a visible picture.')

    const marketing = await payload.findGlobal({ slug: 'marketing-settings', overrideAccess: true })
    const quality = Math.max(1, Math.min(100, Number(marketing.webpQuality || 82)))
    const webp = await sharp(webpInput).rotate().webp({ quality }).toBuffer()
    const outputMetadata = await sharp(webp).metadata()
    if (!outputMetadata.width || !outputMetadata.height || webp.length < 100) throw new Error('The converted WebP image is empty.')

    let originalID = linkedSource?.id
    if (!originalID) {
      const original = await payload.create({
        collection: 'media-originals',
        data: { title: `Original source: ${sourceName}` },
        file: { data: sourceData, mimetype: sourceMime || 'application/octet-stream', name: `${Date.now()}-${sourceName}`, size: sourceData.length },
        overrideAccess: true,
      })
      originalID = original.id
    }

    const outputName = currentName.replace(/\.(jpe?g|png|heic|heif|webp)$/i, '.webp') || `image-${id}.webp`
    await payload.update({
      collection: 'media',
      id,
      data: { sourceOriginal: originalID },
      file: { data: webp, mimetype: 'image/webp', name: outputName, size: webp.length },
      context: { skipMediaOptimization: true },
      overrideAccess: true,
    })
    return NextResponse.json({ success: true, quality })
  } catch (error) {
    console.error('Could not reprocess media from its original source.', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Image reprocessing failed.' }, { status: 500 })
  }
}
