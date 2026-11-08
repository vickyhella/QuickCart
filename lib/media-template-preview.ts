export const DEFAULT_IMAGE_TEMPLATES = {
  imageFilenameTemplate: '{brand}-{productType}-{productName}-{length}-{shape}-{number}',
  imageTitleTemplate: '{brand} {productName} {length} {shape} press-on nails',
  imageAltTemplate: '{brand} {productName} press-on nails in {length} length and {shape} shape',
  imageCaptionTemplate: '{productName} press-on nails by {brand}',
}

export function mediaTemplatePreview(templates: Record<string, unknown>, product: Record<string, unknown>, sourceFilename = 'example.webp') {
  const values: Record<string, string> = {
    brand: String(product.brand || 'Ginny Nana'), productType: String(product.category || 'press-on-nails').replaceAll('-', ' '),
    productName: String(product.title || 'Example product'), length: String(product.length || ''), shape: String(product.shape || ''), size: '',
  }
  // Match Media's upload hook; numbering is illustrative because collisions are checked only on upload.
  const apply = (pattern: string) => pattern.replace(/\{(brand|productType|productName|length|shape|size)\}/g, (_, key: string) => values[key] || '').replace(/\s+/g, ' ').trim()
  const pattern = (key: keyof typeof DEFAULT_IMAGE_TEMPLATES) => String(templates[key] || DEFAULT_IMAGE_TEMPLATES[key])
  const filenamePattern = pattern('imageFilenameTemplate')
  const generated = filenamePattern.includes('{number}') ? apply(filenamePattern.replace('{number}', '01')) : `${apply(filenamePattern)}-01`
  const stem = generated.replace(/[^a-z0-9-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'product-image'
  const preservedExtension = sourceFilename.match(/\.(gif|svg)$/i)?.[0]?.toLowerCase()
  return {
    filename: stem + (preservedExtension || '.webp'),
    title: apply(pattern('imageTitleTemplate')),
    altText: apply(pattern('imageAltTemplate')),
    caption: apply(pattern('imageCaptionTemplate')),
  }
}
