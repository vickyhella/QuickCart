// Keep one server cache layer so CMS saves can expire every public reader together.
export const STOREFRONT_CACHE_SECONDS = 300
export const STOREFRONT_PRODUCTS_TAG = 'storefront-products'
export const STOREFRONT_SETTINGS_TAG = 'storefront-settings'
export const STOREFRONT_NAVIGATION_TAG = 'storefront-navigation'
export const STOREFRONT_PAGES_TAG = 'storefront-pages'

export async function invalidateStorefront(...tags: string[]) {
  try {
    const { revalidateTag } = await import('next/cache.js')
    for (const tag of new Set(tags)) revalidateTag(tag, { expire: 0 })
  } catch (error) {
    // CLI imports/migrations have no Next request cache; their changes use the TTL fallback.
    if (error instanceof Error && error.message.includes('static generation store missing')) return
    console.warn('Storefront cache invalidation failed; data will refresh at its TTL:', error)
  }
}
