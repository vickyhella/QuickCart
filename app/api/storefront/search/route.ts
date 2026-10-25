import { getPublishedCatalog } from '@/lib/storefront-catalog'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const query = (params.get('q') || '').trim().slice(0, 160).toLowerCase()
  const requestedPage = Number(params.get('page'))
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const products = query ? (await getPublishedCatalog()).filter((product) => String(product.title || '').toLowerCase().includes(query)).sort((a, b) => String(a.title).localeCompare(String(b.title))) : []
  const totalPages = Math.max(1, Math.ceil(products.length / 24))
  return Response.json({
    docs: products.slice((page - 1) * 24, page * 24), totalDocs: products.length, totalPages, page,
    hasPrevPage: page > 1, hasNextPage: page < totalPages, prevPage: page > 1 ? page - 1 : null, nextPage: page < totalPages ? page + 1 : null,
  }, { headers: { 'Cache-Control': 'no-store' } })
}
