import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { pinterestProductLink } from '@/lib/pinterest-product-link'
import { getEnvironmentVariable } from '@/lib/environment-config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const secret = getEnvironmentVariable('CRON_SECRET')
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  const accessToken = getEnvironmentVariable('PINTEREST_ACCESS_TOKEN')
  const boardID = getEnvironmentVariable('PINTEREST_BOARD_ID')
  if (!accessToken || !boardID) {
    return NextResponse.json({ error: 'Configure PINTEREST_ACCESS_TOKEN and PINTEREST_BOARD_ID.' }, { status: 503 })
  }

  const payload = await getPayload({ config })
  const due = await payload.find({
    collection: 'pinterest-posts',
    where: { and: [{ status: { equals: 'scheduled' } }, { scheduledAt: { less_than_equal: new Date().toISOString() } }] },
    limit: 50,
    sort: 'scheduledAt',
    depth: 1,
    overrideAccess: true,
  })
  const results: Array<{ id: string | number; status: string; error?: string }> = []

  for (const post of due.docs as any[]) {
    try {
      const imageMedia = post.imageMedia && typeof post.imageMedia === 'object' ? post.imageMedia : null
      const imageURL = String(imageMedia?.url || post.imageURL || '')
      if (!imageURL.startsWith('https://')) throw new Error('The Pin image must use a public HTTPS URL.')
      const pinterestResponse = await fetch('https://api.pinterest.com/v5/pins', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board_id: boardID,
          title: String(post.title).slice(0, 100),
          description: String(post.description || '').slice(0, 500),
          link: pinterestProductLink(post.product, post.variantId, post.link),
          media_source: { source_type: 'image_url', url: imageURL, is_standard: true },
        }),
      })
      const result = await pinterestResponse.json().catch(() => ({}))
      if (!pinterestResponse.ok) throw new Error(result.message || `Pinterest API returned HTTP ${pinterestResponse.status}.`)
      await payload.update({ collection: 'pinterest-posts', id: post.id, data: { status: 'published', pinId: result.id, publishedAt: new Date().toISOString(), lastError: null }, overrideAccess: true })
      results.push({ id: post.id, status: 'published' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Pinterest publishing failed.'
      await payload.update({ collection: 'pinterest-posts', id: post.id, data: { status: 'failed', lastError: message }, overrideAccess: true })
      results.push({ id: post.id, status: 'failed', error: message })
    }
  }
  return NextResponse.json({ processed: results.length, results })
}
