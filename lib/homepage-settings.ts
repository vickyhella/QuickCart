import { unstable_cache } from 'next/cache'
import contentSources from '@/config/content-sources.json'
import defaultHomepage from '@/config/homepage.json'
import { getAdminHomepageSettings } from './storefront-content'
import { STOREFRONT_CACHE_SECONDS, STOREFRONT_SETTINGS_TAG } from './storefront-cache'

const readAdminHomepage = unstable_cache(async () => {
  const { getPayload } = await import('payload')
  const { default: config } = await import('@/payload.config')
  return getAdminHomepageSettings(await getPayload({ config }))
}, ['homepage-settings-v1'], { revalidate: STOREFRONT_CACHE_SECONDS, tags: [STOREFRONT_SETTINGS_TAG] })

export async function getHomepageSettings() {
  if (contentSources.homepage !== 'admin') return defaultHomepage
  try {
    return await readAdminHomepage()
  } catch (error) {
    console.error('Homepage settings unavailable; using repository settings.', error)
    return defaultHomepage
  }
}
