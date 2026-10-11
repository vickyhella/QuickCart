import { REST_GET } from '@payloadcms/next/routes'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'
import config from '@/payload.config'
import { prepareMediaUpload } from '@/lib/prepare-media-upload'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = REST_GET(config)

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return NextResponse.json({ errors: [{ message: 'Authentication required.' }] }, { status: 401 })

  let originalID: string | number | undefined
  try {
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File) || !file.size) return NextResponse.json({ errors: [{ message: 'Choose an image to upload.' }] }, { status: 400 })

    // Finish CPU-heavy decoding/compression before opening any Payload DB transaction.
    const marketing: any = await payload.findGlobal({ slug: 'marketing-settings', overrideAccess: true })
    const prepared = await prepareMediaUpload(file, Number(marketing?.webpQuality || 82))
    const originalName = file.name || `upload-${Date.now()}`
    const original = await payload.create({
      collection: 'media-originals',
      data: { title: `Original source: ${originalName}` },
      file: { data: prepared.original, mimetype: prepared.originalMimeType, name: `${Date.now()}-${originalName}`, size: prepared.original.length },
      overrideAccess: true,
    })
    originalID = original.id

    const refererProductID = request.headers.get('referer')?.match(/\/admin\/collections\/products\/([^/?#]+)/)?.[1]
    const productValue = form.get('product') || (refererProductID && refererProductID !== 'create' ? refererProductID : null)
    const title = String(form.get('title') || '')
    const altText = String(form.get('altText') || '')
    const caption = String(form.get('caption') || '')
    const data: Record<string, unknown> = { sourceOriginal: original.id }
    const product = productValue ? await payload.findByID({ collection: 'products', id: String(productValue), depth: 0, overrideAccess: true }).catch(() => null) : null
    if (title || product?.title) data.title = title || String(product.title)
    if (altText || product?.title) data.altText = altText || String(product.title)
    if (caption) data.caption = caption
    if (productValue) data.product = String(productValue)

    const doc = await payload.create({
      collection: 'media',
      data,
      file: { data: prepared.output, mimetype: prepared.outputMimeType, name: prepared.outputName, size: prepared.output.length },
      user,
      overrideAccess: true,
    })
    return NextResponse.json({ doc })
  } catch (error) {
    if (originalID !== undefined) await payload.delete({ collection: 'media-originals', id: originalID, overrideAccess: true }).catch(() => undefined)
    const message = error instanceof Error ? error.message : 'Could not upload this image.'
    return NextResponse.json({ errors: [{ message }] }, { status: 500 })
  }
}
