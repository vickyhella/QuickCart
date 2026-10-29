import config from '@/payload.config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import { STOREFRONT_CACHE_SECONDS, STOREFRONT_NAVIGATION_TAG } from '@/lib/storefront-cache'
import categoryImages from '@/config/category-images.json'
import contentSources from '@/config/content-sources.json'
import { defaultProductDimensionOptions } from '@/lib/product-dimensions'

export const dynamic = 'force-dynamic'

const getNavigationData = unstable_cache(async () => {
  const payload = await getPayload({ config })
  const [dimensions, result] = await Promise.all([
    payload.findGlobal({ slug: 'product-dimensions', depth: 0, overrideAccess: true }),
    payload.find({ collection: 'pages', where: { status: { equals: 'published' } }, limit: 1000, depth: 0, select: { title: true, slug: true, placement: true }, overrideAccess: true }),
  ])
  const pages = result.docs.map((page: any) => ({
    title: page.title,
    slug: page.slug,
    placement: page.placement || (['privacy-policy', 'terms-conditions', 'refunds-returns', 'shipping-policy'].includes(page.slug) ? 'footer-customer-care' : ['about-us', 'contact-us'].includes(page.slug) ? 'footer-explore' : 'hidden'),
  }))
  const imageSettings = Array.isArray(dimensions.dimensions) ? (dimensions.dimensions as any[]).find((item) => item?.key === '__category-preview-images')?.options || [] : []
  const imageIDs = imageSettings.map((item: any) => String(item?.image || '')).filter(Boolean)
  const imageDocs = imageIDs.length ? await payload.find({ collection: 'media', where: { id: { in: imageIDs } }, limit: imageIDs.length, depth: 0, select: { url: true }, overrideAccess: true }) : { docs: [] }
  const imageURLs = new Map<string, string>(imageDocs.docs.map((item: any) => [String(item.id), String(item.url || '')] as [string, string]))
  const configuredImages = new Map<string, string>(imageSettings.map((image: any) => [String(image.value), String(image.image || '')] as [string, string]))
  const withImages = (key: string, options: any[] = []) => options.map((option) => {
    const staticImage = contentSources.categoryImages === 'repository' ? categoryImages[key as keyof typeof categoryImages]?.[String(option.value) as keyof typeof categoryImages.lengths] : undefined
    if (staticImage) return { ...option, image: { url: staticImage.image, alt: staticImage.alt } }
    const url = imageURLs.get(configuredImages.get(`${key}:${option.value}`) || '')
    return { ...option, image: url ? { url } : null }
  })
  const products = await payload.find({
    collection: 'products',
    where: { status: { equals: 'published' } },
    limit: 10000,
    depth: 0,
    select: { length: true, shape: true, variants: { enabled: true, length: true, shape: true } },
    overrideAccess: true,
  })
  const includeProductValues = (options: any[], key: 'length' | 'shape') => {
    const values = new Set(options.map((option) => String(option.value)))
    for (const product of products.docs as any[]) {
      const variants = (product.variants || []).filter((variant: any) => variant.enabled !== false)
      const productValues = (product.variants || []).length ? variants.map((variant: any) => variant[key]) : String(product[key] || '').split(',')
      for (const raw of productValues) {
        const value = String(raw || '').trim()
        if (value && !values.has(value)) {
          values.add(value)
          options.push({ value, label: value.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()), image: null })
        }
      }
    }
    return options
  }
  const shapes = includeProductValues(withImages('shapes', dimensions.shapes || []), 'shape')
    // To restore a temporarily hidden shape, remove it from config/category-images.json's hiddenShapes list.
    .filter((option) => contentSources.categoryImages === 'admin' || !(categoryImages.hiddenShapes as readonly string[]).includes(String(option.value)))
  return {
    lengths: includeProductValues(withImages('lengths', dimensions.lengths || []), 'length'),
    shapes,
    pages,
  }
}, [`storefront-navigation-v4-${contentSources.categoryImages}`], { revalidate: STOREFRONT_CACHE_SECONDS, tags: [STOREFRONT_NAVIGATION_TAG] })

export async function GET() {
  let data
  try {
    data = await getNavigationData()
  } catch {
    if (contentSources.categoryImages === 'admin') return Response.json({ error: 'Category settings are unavailable.' }, { status: 503 })
    const options = (key: 'lengths' | 'shapes') => defaultProductDimensionOptions[key]
      .filter((option: any) => key !== 'shapes' || !(categoryImages.hiddenShapes as readonly string[]).includes(String(option.value)))
      .map((option: any) => {
      const staticImage = categoryImages[key][String(option.value) as keyof typeof categoryImages.lengths]
      return { ...option, image: staticImage ? { url: staticImage.image, alt: staticImage.alt } : null }
    })
    data = { lengths: options('lengths'), shapes: options('shapes'), pages: [] }
  }
  return Response.json(data, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
