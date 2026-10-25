import { getPublishedCatalog } from '@/lib/storefront-catalog'

export const dynamic = 'force-dynamic'

export async function GET() {
  const docs = await getPublishedCatalog()
  return Response.json({ docs }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
