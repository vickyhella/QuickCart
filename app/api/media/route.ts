import { REST_GET } from '@payloadcms/next/routes'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'
import config from '@/payload.config'
import { prepareMediaUpload } from '@/lib/prepare-media-upload'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = REST_GET(config)

const applyTemplate = (template: string, values: Record<string, string>) =>
  template.replace(/\{(brand|productType|productName|length|shape|size)\}/g, (_, token: string) => values[token] || '').replace(/\s+/g, ' ').trim()

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return NextResponse.json({ errors: [{ message: 'Authentication required.' }] }, { status: 401 })

  let originalID: string | number | undefined
  let stage = 'reading upload'
  try {
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File) || !file.size) return NextResponse.json({ errors: [{ message: 'Choose an image to upload.' }] }, { status: 400 })

    // Payload's native upload drawer serializes editable fields into `_payload`
    // and only treats HTTP 201 with a `{ doc }` response as a successful save.
    let submittedData: Record<string, unknown> = {}
    const serializedData = form.get('_payload')
    if (typeof serializedData === 'string') {
      try {
        const parsed = JSON.parse(serializedData)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) submittedData = parsed
      } catch {
        // Direct upload clients may omit `_payload`; their optional fields are
        // read from individual form entries below.
      }
    }
    const formValue = (key: string) => form.get(key) || submittedData[key]

    stage = 'reading marketing settings'
    const marketing: any = await payload.findGlobal({ slug: 'marketing-settings', overrideAccess: true })
    // Finish CPU-heavy decoding/compression before opening any Payload DB transaction.
    stage = 'converting image'
    const prepared = await prepareMediaUpload(file, Number(marketing?.webpQuality || 82))
    const refererProductID = request.headers.get('referer')?.match(/\/admin\/collections\/products\/([^/?#]+)/)?.[1]
    const productValue = formValue('product') || (refererProductID && refererProductID !== 'create' ? refererProductID : null)
    stage = 'loading product metadata'
    const product = productValue ? await payload.findByID({ collection: 'products', id: String(productValue), depth: 0, overrideAccess: true }).catch(() => null) : null
    const values = {
      brand: String(product?.brand || 'Ginny Nana'),
      productType: String(product?.category || 'press-on-nails').replaceAll('-', ' '),
      productName: String(product?.title || file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') || 'Product image'),
      length: String(product?.length || ''),
      shape: String(product?.shape || ''),
      size: '',
    }
    const title = String(formValue('title') || product?.title || applyTemplate(String(marketing?.imageTitleTemplate || '{brand} {productName} {length} {shape} press-on nails'), values))
    const altText = String(formValue('altText') || applyTemplate(String(marketing?.imageAltTemplate || '{brand} {productName} press-on nails in {length} length and {shape} shape'), values))
    const caption = String(formValue('caption') || applyTemplate(String(marketing?.imageCaptionTemplate || '{productName} press-on nails by {brand}'), values))

    // Generate configured SEO filenames before create, keeping queries outside
    // Media.beforeValidate's database transaction.
    const originalName = file.name || `upload-${Date.now()}`
    const extension = prepared.outputName.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() || ''
    const filenameTemplate = String(marketing?.imageFilenameTemplate || '{brand}-{productType}-{productName}-{length}-{shape}-{number}')
    const base = applyTemplate(filenameTemplate.replace(/\{number\}/g, ''), values).replace(/[-_\s]+$/g, '').replace(/[^a-z0-9-]+/gi, '-').replace(/-+/g, '-').toLowerCase() || 'product-image'
    let outputName = ''
    stage = 'checking filename availability'
    for (let sequence = 1; sequence < 10000; sequence += 1) {
      const number = String(sequence).padStart(2, '0')
      const generated = filenameTemplate.includes('{number}') ? applyTemplate(filenameTemplate.replace('{number}', number), values) : `${applyTemplate(filenameTemplate, values)}-${number}`
      const slug = generated.replace(/[^a-z0-9-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() || base
      const candidate = `${slug}${extension}`
      const collision = await payload.find({ collection: 'media', where: { filename: { equals: candidate } }, limit: 1, depth: 0, overrideAccess: true })
      if (!collision.docs.length) {
        outputName = candidate
        break
      }
    }
    if (!outputName) throw new Error('Could not generate a unique image filename.')

    stage = 'saving original image'
    const original = await payload.create({
      collection: 'media-originals',
      data: { title: `Original source: ${originalName}` },
      file: { data: prepared.original, mimetype: prepared.originalMimeType, name: `${Date.now()}-${originalName}`, size: prepared.original.length },
      overrideAccess: true,
    })
    originalID = original.id

    const data: Record<string, unknown> = { sourceOriginal: original.id, title, altText, caption }
    // Never store a stale or unsaved form value in the relationship. New
    // products receive this relationship after Payload assigns their ID.
    if (product?.id) data.product = product.id

    stage = 'saving WebP image'
    const doc = await payload.create({
      collection: 'media',
      data,
      file: { data: prepared.output, mimetype: prepared.outputMimeType, name: outputName, size: prepared.output.length },
      user,
      overrideAccess: true,
      context: { skipMediaMetadata: true },
    })
    return NextResponse.json({ doc, converted: prepared.outputMimeType === 'image/webp' && prepared.originalMimeType !== 'image/webp' }, { status: 201 })
  } catch (error) {
    if (originalID !== undefined) await payload.delete({ collection: 'media-originals', id: originalID, overrideAccess: true }).catch(() => undefined)
    const message = error instanceof Error ? error.message : 'Could not upload this image.'
    console.error(`[media-upload] failed while ${stage}`, error)
    return NextResponse.json({ errors: [{ message: `Image upload failed while ${stage}: ${message}` }] }, { status: 500 })
  }
}
