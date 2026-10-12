import sharp from 'sharp'
import heicConvert from 'heic-convert'

export async function prepareMediaUpload(file: File, quality: number) {
  const source = Buffer.from(await file.arrayBuffer())
  const name = file.name || `upload-${Date.now()}`
  const mimeType = (file.type || '').toLowerCase()
  const isHEIC = /\.(heic|heif)$/i.test(name) || mimeType.includes('heic') || mimeType.includes('heif')
  const isWebP = mimeType === 'image/webp' || /\.webp$/i.test(name)
  const isAnimatedOrVector = mimeType === 'image/gif' || mimeType === 'image/svg+xml' || /\.(gif|svg)$/i.test(name)

  if (isAnimatedOrVector) return { original: source, originalMimeType: mimeType || 'application/octet-stream', output: source, outputMimeType: mimeType || 'application/octet-stream', outputName: name }

  let decoded = source
  if (isHEIC) {
    try {
      decoded = Buffer.from(await heicConvert({ buffer: source, format: 'JPEG', quality: 1 }))
    } catch (error) {
      throw new Error('This HEIC/HEIF image could not be decoded. Please try exporting it as JPEG or PNG.', { cause: error })
    }
  }

  const image = sharp(decoded).rotate()
  const metadata = await image.metadata()
  if (!metadata.width || !metadata.height) throw new Error('The uploaded image could not be decoded into a visible picture.')
  if (isWebP) return { original: source, originalMimeType: mimeType || 'image/webp', output: source, outputMimeType: 'image/webp', outputName: name }

  const clampedQuality = Math.max(1, Math.min(100, Number(quality) || 82))
  const output = await image.webp({ quality: clampedQuality }).toBuffer()
  const outputMetadata = await sharp(output).metadata()
  if (!outputMetadata.width || !outputMetadata.height || output.length === 0) throw new Error('The converted WebP image is empty.')
  const stem = name.replace(/\.[^.]+$/, '') || `product-image-${Date.now()}`
  return {
    original: source,
    originalMimeType: mimeType || (isHEIC ? 'image/heic' : 'application/octet-stream'),
    output,
    outputMimeType: 'image/webp',
    outputName: `${stem}.webp`,
  }
}
