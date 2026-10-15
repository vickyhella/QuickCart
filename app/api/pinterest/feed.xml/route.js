import { getPayload } from 'payload'
import config from '@/payload.config'
import { resolveProductMedia } from '@/lib/resolve-product-media'
import { getEnvironmentVariable } from '@/lib/environment-config'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const xml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;')

const plainText = (value = '') => String(value)
  .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  .replace(/[`*_>#~]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const urlFor = (value, base) => {
  if (!value) return ''
  try { return new URL(value, base).toString() } catch { return '' }
}

const mediaDoc = (value) => value && typeof value === 'object' ? value : null

export async function GET() {
  const payload = await getPayload({ config })
  const products = []
  let page = 1
  let hasNextPage = true
  while (hasNextPage) {
    const result = await payload.find({
      collection: 'products',
      where: { status: { equals: 'published' } },
      depth: 1,
      limit: 100,
      page,
      overrideAccess: true,
    })
    products.push(...result.docs)
    hasNextPage = result.hasNextPage
    page += 1
  }
  const productsWithMedia = await resolveProductMedia(payload, products)

  const siteURL = (getEnvironmentVariable('NEXT_PUBLIC_SITE_URL') || 'https://ginnynana.com').replace(/\/$/, '')
  const currency = getEnvironmentVariable('NEXT_PUBLIC_CURRENCY') || 'USD'
  const entries = productsWithMedia.flatMap((product) => {
    const shippingWeight = Number(product.shippingWeight) > 0 ? Number(product.shippingWeight) : 0.2
    const featured = mediaDoc(product.featuredImage)
    const gallery = (product.gallery || []).map(mediaDoc).filter(Boolean)
    const configuredVariants = product.variants || []
    const variants = configuredVariants.filter((variant) => variant.enabled !== false)
    const rows = configuredVariants.length ? variants : [null]
    const groupId = product.sku || product.id

    return rows.map((variant) => {
      const variantImage = mediaDoc(variant?.image)
      const mainImage = variantImage || featured || gallery[0]
      const imageURL = urlFor(mainImage?.url, siteURL)
      const salePrice = Number(variant?.price ?? product.price)
      const regularPrice = Number(variant?.compareAtPrice ?? product.compareAtPrice ?? 0)
      const hasSalePrice = regularPrice > salePrice
      const price = hasSalePrice ? regularPrice : salePrice
      if (!imageURL || !Number.isFinite(price) || price <= 0) return null
      const additionalImages = [...new Set([featured, ...gallery].map((image) => urlFor(image?.url, siteURL)).filter((url) => url && url !== imageURL))].slice(0, 10)
      const nameParts = [variant?.length, variant?.shape, variant?.size?.toUpperCase()].filter(Boolean)
      const title = `${product.title}${nameParts.length ? ` - ${nameParts.join(' ')}` : ''}`
      const link = new URL(`/product/${encodeURIComponent(product.slug || product.id)}/`, siteURL)
      if (variant?.id) link.searchParams.set('variant', String(variant.id))
      const available = !variant?.trackStock || Number(variant.stock ?? 0) > 0
      const altTexts = [mainImage?.altText || `${product.title}${nameParts.length ? ` ${nameParts.join(' ')}` : ''}`, ...additionalImages.map((_, index) => [featured, ...gallery].filter(Boolean)[index]?.altText || `${product.title} product view ${index + 2}`)]
      const size = variant?.size ? `<g:size>${xml(variant.size.toUpperCase())}</g:size>` : ''
      const variantNames = variant ? '<g:variant_names>Length,Shape,Size</g:variant_names>' : ''
      const variantValues = variant ? `<g:variant_values>${xml([variant.length, variant.shape, variant.size?.toUpperCase()].filter(Boolean).join(','))}</g:variant_values>` : ''
      const moreImages = additionalImages.map((url) => `<g:additional_image_link>${xml(url)}</g:additional_image_link>`).join('')
      return `<item>
        <g:id>${xml(variant?.sku || (variant ? `${groupId}-${variant.id}` : groupId))}</g:id>
        ${variants.length ? `<g:item_group_id>${xml(groupId)}</g:item_group_id>` : ''}
        <g:title>${xml(title)}</g:title>
        <g:description>${xml(plainText(product.description || product.title))}</g:description>
        <g:link>${xml(link.toString())}</g:link>
        <g:image_link>${xml(imageURL)}</g:image_link>
        ${moreImages}
        <g:alt_text>${xml(altTexts.join(', '))}</g:alt_text>
        <g:price>${price.toFixed(2)} ${xml(currency)}</g:price>
        ${hasSalePrice ? `<g:sale_price>${salePrice.toFixed(2)} ${xml(currency)}</g:sale_price>` : ''}
        <g:availability>${available ? 'in stock' : 'out of stock'}</g:availability>
        <g:condition>${xml(product.condition || 'new')}</g:condition>
        <g:shipping_weight>${shippingWeight} kg</g:shipping_weight>
        <g:brand>${xml(product.brand || 'Ginny Nana')}</g:brand>
        <g:product_type>${xml(product.category === 'press-on-nails' ? 'Beauty & Personal Care > Nails > Press-on Nails' : product.category || 'Press-on Nails')}</g:product_type>
        <g:google_product_category>${xml(product.googleProductCategory || 'Health & Beauty > Personal Care > Cosmetics > Nail Care > False Nails')}</g:google_product_category>
        ${product.color ? `<g:color>${xml(product.color)}</g:color>` : ''}
        ${size}
        ${product.material ? `<g:material>${xml(product.material)}</g:material>` : ''}
        ${product.gender ? `<g:gender>${xml(product.gender)}</g:gender>` : ''}
        ${product.ageGroup ? `<g:age_group>${xml(product.ageGroup)}</g:age_group>` : ''}
        <g:adult>${product.adult === true ? 'true' : 'false'}</g:adult>
        ${product.gtin ? `<g:gtin>${xml(product.gtin)}</g:gtin>` : ''}
        ${product.mpn ? `<g:mpn>${xml(product.mpn)}</g:mpn>` : ''}
        ${variantNames}
        ${variantValues}
        ${Number(product.multipack || 0) > 1 ? `<g:multipack>${Math.floor(Number(product.multipack))}</g:multipack>` : ''}
      </item>`
    }).filter(Boolean)
  })

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel><title>Ginny Nana Products</title><link>${xml(siteURL)}</link><description>Published product catalog</description>
    ${entries.join('\n')}
  </channel>
</rss>`

  return new Response(feed, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'no-store, max-age=0' } })
}
