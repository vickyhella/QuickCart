import { isAdminUser } from '@/lib/admin-access'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { prepareMediaUpload } from '@/lib/prepare-media-upload'
import { uniqueOriginalFilename } from '@/lib/media-filenames'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!isAdminUser(user)) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  let createdOriginalID: string | number | undefined
  let mediaUpdated = false
  try {
    const { id } = await context.params
    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File) || !file.size) return NextResponse.json({ error: 'Choose a replacement image.' }, { status: 400 })
    const current: any = await payload.findByID({ collection: 'media', id, depth: 0, overrideAccess: true })
    const marketing: any = await payload.findGlobal({ slug: 'marketing-settings', depth: 0, overrideAccess: true })
    const prepared = await prepareMediaUpload(file, Number(marketing?.webpQuality || 82), current.filename)
    const originalName = file.name || `replacement-${Date.now()}`
    const originalFilename = await uniqueOriginalFilename(payload, current.filename, originalName)
    const original = await payload.create({
      collection: 'media-originals',
      data: { title: `Original source: ${current.filename}` },
      file: { data: prepared.original, mimetype: prepared.originalMimeType, name: originalFilename, size: prepared.original.length },
      overrideAccess: true,
    })
    createdOriginalID = original.id
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
      overwriteExistingFiles: true,
      context: { skipMediaMetadata: true },
    })
    mediaUpdated = true
    const oldOriginalID = current.sourceOriginal && typeof current.sourceOriginal === 'object' ? current.sourceOriginal.id : current.sourceOriginal
    if (oldOriginalID && String(oldOriginalID) !== String(original.id)) {
      const otherUses = await payload.find({ collection: 'media', where: { sourceOriginal: { equals: String(oldOriginalID) } }, limit: 2, depth: 0, overrideAccess: true })
      if (!otherUses.docs.length) await payload.delete({ collection: 'media-originals', id: oldOriginalID, overrideAccess: true }).catch(() => undefined)
    }
    return NextResponse.json({ success: true, id: updated.id, filename: updated.filename, url: updated.url })
  } catch (error) {
    if (!mediaUpdated && createdOriginalID !== undefined) await payload.delete({ collection: 'media-originals', id: createdOriginalID, overrideAccess: true }).catch(() => undefined)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not replace this image.' }, { status: 500 })
  }
}
