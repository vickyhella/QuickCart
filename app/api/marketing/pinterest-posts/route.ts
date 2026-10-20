import { isAdminUser } from '@/lib/admin-access'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!isAdminUser(user)) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const posts = await payload.find({
    collection: 'pinterest-posts',
    limit: 100,
    pagination: false,
    sort: '-scheduledAt',
    depth: 1,
    overrideAccess: true,
  })

  return NextResponse.json({ posts: posts.docs.map((post: any) => ({
    id: String(post.id),
    productTitle: typeof post.product === 'object' && post.product ? String(post.product.title || '') : '',
    title: String(post.title || ''),
    imageURL: typeof post.imageMedia === 'object' && post.imageMedia ? String(post.imageMedia.url || post.imageURL || '') : String(post.imageURL || ''),
    scheduledAt: post.scheduledAt,
    status: post.status,
    publishedAt: post.publishedAt || null,
    pinId: post.pinId || null,
    lastError: post.lastError || null,
  })) })
}

export async function PATCH(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!isAdminUser(user)) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  try {
    const body = await request.json()
    const id = typeof body.id === 'string' || typeof body.id === 'number' ? String(body.id) : ''
    if (!id || !['retry', 'cancel'].includes(body.action)) {
      return NextResponse.json({ error: 'Choose a valid post and action.' }, { status: 400 })
    }

    const post: any = await payload.findByID({ collection: 'pinterest-posts', id, overrideAccess: true }).catch(() => null)
    if (!post) return NextResponse.json({ error: 'Publishing post not found.' }, { status: 404 })

    if (body.action === 'retry') {
      if (post.status !== 'failed') return NextResponse.json({ error: 'Only failed posts can be retried.' }, { status: 409 })
      await payload.update({ collection: 'pinterest-posts', id, data: { status: 'scheduled', scheduledAt: new Date().toISOString(), lastError: null }, overrideAccess: true })
    } else {
      if (post.status !== 'scheduled') return NextResponse.json({ error: 'Only scheduled posts can be cancelled.' }, { status: 409 })
      await payload.update({ collection: 'pinterest-posts', id, data: { status: 'draft' }, overrideAccess: true })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update publishing post.' }, { status: 500 })
  }
}
