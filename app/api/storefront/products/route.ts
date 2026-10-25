import config from '@/payload.config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

const getPublishedProducts = unstable_cache(async () => {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'products',
    where: { status: { equals: 'published' } },
    limit: 100,
    depth: 1,
    sort: '-createdAt',
    overrideAccess: true,
  })
  return result.docs
}, ['storefront-published-products-v1'], { revalidate: 60, tags: ['storefront-products'] })

export async function GET() {
  const docs = await getPublishedProducts()
  return Response.json({ docs }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  })
}
