const pending = new Map()

// Coalesce simultaneous mounts; normal requests can reuse the browser's short private cache.
export function fetchStorefrontJSON(url, refresh = false) {
  const key = `${url}:${Boolean(refresh)}`
  if (!pending.has(key)) {
    pending.set(key, fetch(url, { cache: refresh ? 'reload' : 'default' })
      .then((response) => {
        if (!response.ok) throw new Error('Could not load storefront data')
        return response.json()
      }).finally(() => pending.delete(key)))
  }
  return pending.get(key)
}
