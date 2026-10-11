import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { prepareMediaUpload } from '@/lib/prepare-media-upload'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  try {
    const { id } = await context.params
    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File) || !file.size) return NextResponse.json({ error: 'Choose a replacement image.' }, { status: 400 })
    const current: any = await payload.findByID({ collection: 'media', id, depth: 0, overrideAccess: true })
    const marketing: any = await payload.findGlobal({ slug: 'marketing-settings', overrideAccess: true })
    const prepared = await prepareMediaUpload(file, Number(marketing?.webpQuality || 82))
    const originalName = file.name || `replacement-${Date.now()}`
    const original = await payload.create({
      collection: 'media-originals',
      data: { title: `Original source: ${originalName}` },
      file: { data: prepared.original, mimetype: prepared.originalMimeType, name: `${Date.now()}-${originalName}`, size: prepared.original.length },
      overrideAccess: true,
    })
    const updated = await payload.update({
      collection: 'media',
      id,
      data: {
        title: current.title,
        altText: current.altText,
        caption: current.caption,
        product: current.product,
        sourceOriginal: original.id,
      },
      file: { data: prepared.output, mimetype: prepared.outputMimeType, name: prepared.outputName, size: prepared.output.length },
      overrideAccess: true,
    })
    return NextResponse.json({ success: true, id: updated.id, filename: updated.filename, url: updated.url })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not replace this image.' }, { status: 500 })
  }
}
