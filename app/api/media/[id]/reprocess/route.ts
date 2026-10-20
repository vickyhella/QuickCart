import { isAdminUser } from '@/lib/admin-access'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { ReprocessMediaError, reprocessMediaFromOriginal } from '@/lib/reprocess-media'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!isAdminUser(user)) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  try {
    const { id } = await context.params
    const result = await reprocessMediaFromOriginal(payload, id)
    return NextResponse.json({ success: true, quality: result.quality, doc: result.doc })
  } catch (error) {
    console.error('Could not reprocess media from its original source.', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Image reprocessing failed.' }, { status: error instanceof ReprocessMediaError ? error.status : 500 })
  }
}
