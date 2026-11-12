import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { pinterestProductLink } from '@/lib/pinterest-product-link'
import { getEnvironmentVariable } from '@/lib/environment-config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const batchLimit = 5
const batchBudgetMs = 20_000
const pinTimeoutMs = 5_000
const saveReserveMs = 3_000

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

  const deadline = performance.now() + batchBudgetMs
  const payload = await getPayload({ config })
  const due = await payload.find({
    collection: 'pinterest-posts',
    where: { and: [{ status: { equals: 'scheduled' } }, { scheduledAt: { less_than_equal: new Date().toISOString() } }] },
    limit: batchLimit,
    sort: ['scheduledAt', 'id'],
    depth: 1,
    overrideAccess: true,
  })
  const results: Array<{ id: string | number; status: string; error?: string }> = []

  for (const post of due.docs) {
    if (deadline - performance.now() < pinTimeoutMs + saveReserveMs) break
    try {
      const imageMedia = post.imageMedia && typeof post.imageMedia === 'object' ? post.imageMedia : null
      const imageURL = String(imageMedia?.url || post.imageURL || '')
      if (!imageURL.startsWith('https://')) throw new Error('The Pin image must use a public HTTPS URL.')
      const pinterestResponse = await fetch('https://api.pinterest.com/v5/pins', {
        method: 'POST',
        signal: AbortSignal.timeout(pinTimeoutMs),
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board_id: boardID,
          title: String(post.title).slice(0, 100),
          description: String(post.description || '').slice(0, 500),
          link: pinterestProductLink(typeof post.product === 'object' ? post.product : { id: post.product }, post.variantId, post.link),
          media_source: { source_type: 'image_url', url: imageURL, is_standard: true },
        }),
      })
      const result = await pinterestResponse.json().catch(() => ({}))
      if (!pinterestResponse.ok) throw new Error(result.message || `Pinterest API returned HTTP ${pinterestResponse.status}.`)
      if (typeof result.id !== 'string' || !result.id) throw new Error('Pinterest did not return a Pin ID. Check Pinterest before retrying.')
      await payload.update({ collection: 'pinterest-posts', id: post.id, data: { status: 'published', pinId: result.id, publishedAt: new Date().toISOString(), lastError: null }, overrideAccess: true })
      results.push({ id: post.id, status: 'published' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Pinterest publishing failed.'
      await payload.update({ collection: 'pinterest-posts', id: post.id, data: { status: 'failed', lastError: message }, overrideAccess: true })
      results.push({ id: post.id, status: 'failed', error: message })
    }
  }
  return NextResponse.json({ processed: results.length, remaining: due.totalDocs - results.length, results })
}
