import config from '@/payload.config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function GET() {
  const payload = await getPayload({ config })
  const [dimensions, result] = await Promise.all([
    payload.findGlobal({ slug: 'product-dimensions', depth: 1, overrideAccess: true }).catch(() => ({} as any)),
    payload.find({ collection: 'pages', where: { status: { equals: 'published' } }, limit: 1000, depth: 0, overrideAccess: true }),
  ])
  const pages = result.docs.map((page: any) => ({
    title: page.title,
    slug: page.slug,
    placement: page.placement || (['privacy-policy', 'terms-conditions', 'refunds-returns', 'shipping-policy'].includes(page.slug) ? 'footer-customer-care' : ['about-us', 'contact-us'].includes(page.slug) ? 'footer-explore' : 'hidden'),
  }))
  const imageSettings = Array.isArray(dimensions.dimensions) ? dimensions.dimensions.find((item: any) => item?.key === '__category-preview-images')?.options || [] : []
  const imageIDs = imageSettings.map((item: any) => String(item?.image || '')).filter(Boolean)
  const imageDocs = imageIDs.length ? await payload.find({ collection: 'media', where: { id: { in: imageIDs } }, limit: imageIDs.length, depth: 0, overrideAccess: true }) : { docs: [] }
  const imageURLs = new Map<string, string>(imageDocs.docs.map((item: any) => [String(item.id), String(item.url || '')] as [string, string]))
  const configuredImages = new Map<string, string>(imageSettings.map((image: any) => [String(image.value), String(image.image || '')] as [string, string]))
  const withImages = (key: string, options: any[] = []) => options.map((option) => {
    const url = imageURLs.get(configuredImages.get(`${key}:${option.value}`) || '')
    return { ...option, image: url ? { url } : null }
  })
  const products = await payload.find({ collection: 'products', where: { status: { equals: 'published' } }, limit: 10000, depth: 0, overrideAccess: true })
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
  return Response.json({
    lengths: includeProductValues(withImages('lengths', dimensions.lengths || []), 'length'),
    shapes: includeProductValues(withImages('shapes', dimensions.shapes || []), 'shape'),
    pages,
  })
}
