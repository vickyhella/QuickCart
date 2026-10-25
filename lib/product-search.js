export function productSearchURL(query, page = 1) {
  const params = new URLSearchParams({
    q: String(query).trim().slice(0, 160),
    page: String(Math.max(1, Math.floor(Number(page)) || 1)),
  })
  return `/api/storefront/search?${params}`
}
