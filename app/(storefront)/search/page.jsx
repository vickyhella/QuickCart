import ProductSearch from '@/components/ProductSearch'

export const metadata = { title: 'Search products | Ginny Nana', robots: { index: false, follow: true } }

export default async function SearchPage({ searchParams }) {
  const params = await searchParams
  const query = String(params.q || '').trim().slice(0, 160)
  const page = Math.max(1, Math.floor(Number(params.page)) || 1)
  return <ProductSearch key={`${query}:${page}`} query={query} page={page} />
}
