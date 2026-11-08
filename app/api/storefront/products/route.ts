import { toStorefrontSummary } from '@/lib/storefront-product'
import { getPublishedCatalog } from '@/lib/storefront-catalog'

export const dynamic = 'force-dynamic'

export async function GET() {
  const docs = await getPublishedCatalog()
  return Response.json({ docs: docs.map(toStorefrontSummary) }, {
    headers: { 'Cache-Control': 'private, max-age=30, must-revalidate' },
  })
}
