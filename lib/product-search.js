export function productSearchURL(query, page = 1) {
  const params = new URLSearchParams({
    'where[status][equals]': 'published',
    'where[title][contains]': String(query).trim().slice(0, 160),
    limit: '24',
    page: String(Math.max(1, Math.floor(Number(page)) || 1)),
    depth: '1',
    sort: 'title',
  })
  return `/api/products?${params}`
}
