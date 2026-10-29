import config from '@/payload.config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import { resolveProductMedia } from './resolve-product-media'
import { STOREFRONT_CACHE_SECONDS, STOREFRONT_PRODUCTS_TAG, STOREFRONT_SETTINGS_TAG } from './storefront-cache'

// Do not fetch supplier relations, internal notes or image originals for public readers.
const publicProductSelect = {
  title: true, slug: true, description: true, category: true, sku: true,
  price: true, compareAtPrice: true, status: true, publishedAt: true, createdAt: true,
  isNew: true, isBestSeller: true, length: true, shape: true, color: true,
  featuredImage: true, gallery: true,
  variants: { id: true, sku: true, length: true, shape: true, size: true, attributes: true, price: true, compareAtPrice: true, image: true, stock: true, trackStock: true, enabled: true },
  seoTitle: true, seoDescription: true, seoCanonicalUrl: true, seoNoIndex: true,
  brand: true, material: true, shippingWeight: true, gender: true, ageGroup: true,
  condition: true, adult: true, multipack: true, gtin: true, mpn: true, googleProductCategory: true,
} as const

const readPublishedCatalog = unstable_cache(async (): Promise<Record<string, any>[]> => {
  const payload = await getPayload({ config })
  const products: Record<string, any>[] = []
  let page = 1
  let hasNextPage = true
  while (hasNextPage) {
    const result = await payload.find({
      collection: 'products', where: { status: { equals: 'published' } },
      limit: 100, page, sort: '-createdAt', depth: 0, select: publicProductSelect, overrideAccess: true,
    })
    products.push(...result.docs)
    hasNextPage = result.hasNextPage
    page += 1
  }
  // Batch image IDs once instead of populating each product's relationships separately.
  const resolved = await resolveProductMedia(payload, products)
  console.info('[storefront-cache] catalog refreshed', { products: resolved.length, pages: page - 1, jsonBytes: Buffer.byteLength(JSON.stringify(resolved)) })
  return resolved
}, ['storefront-public-catalog-v2'], { revalidate: STOREFRONT_CACHE_SECONDS, tags: [STOREFRONT_PRODUCTS_TAG] })

let pendingCatalog: Promise<Record<string, any>[]> | undefined
export function getPublishedCatalog() {
  // Coalesce simultaneous cold-cache reads within a server instance.
  if (!pendingCatalog) pendingCatalog = readPublishedCatalog().finally(() => { pendingCatalog = undefined })
  return pendingCatalog
}

export const getStorefrontMarketingSettings = unstable_cache(async () => {
  const payload = await getPayload({ config })
  return payload.findGlobal({
    slug: 'marketing-settings', depth: 0, overrideAccess: true,
    select: {
      homepageHeroImage: true, homepageHeroProduct: true, homepageHeroImageAlt: true,
      homepageMysteryBoxImage: true, homepageMysteryBoxProduct: true, homepageMysteryBoxImageAlt: true,
      homepageMysteryBoxEyebrow: true, homepageMysteryBoxTitle: true, homepageMysteryBoxDescription: true,
      productTitleTemplate: true, productDescriptionTemplate: true,
    },
  }) as Promise<Record<string, any>>
}, ['storefront-marketing-v1'], { revalidate: STOREFRONT_CACHE_SECONDS, tags: [STOREFRONT_SETTINGS_TAG] })
