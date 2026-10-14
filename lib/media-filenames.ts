export async function uniqueOriginalFilename(payload: any, webpFilename: string, sourceFilename: string) {
  const base = webpFilename.replace(/\.[^.]+$/, '') || 'product-image'
  const extension = sourceFilename.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() || ''

  for (let sequence = 1; sequence < 10000; sequence += 1) {
    const suffix = sequence === 1 ? '' : `-${String(sequence).padStart(2, '0')}`
    const filename = `${base}-original${suffix}${extension}`
    const collision = await payload.find({
      collection: 'media-originals',
      where: { filename: { equals: filename } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (!collision.docs.length) return filename
  }

  throw new Error('Could not generate a unique original image filename.')
}
