import config from '@payload-config'
import { getPayload } from 'payload'
import { deleteUnusedMedia, inspectUnusedMedia } from '@/lib/unused-media-cleanup'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ error: 'Authentication required.' }, { status: 401 })
  try {
    const usage = await inspectUnusedMedia(payload)
    return Response.json({ total: usage.length, unreferenced: usage.filter((item) => !item.referenced).length, referenced: usage.filter((item) => item.referenced).length })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Could not inspect images.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Invalid origin.' }, { status: 403 })
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ error: 'Authentication required.' }, { status: 401 })
  try {
    return Response.json(await deleteUnusedMedia(payload))
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Could not delete images.' }, { status: 500 })
  }
}
