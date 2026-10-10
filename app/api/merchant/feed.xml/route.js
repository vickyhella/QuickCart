import { getPayload } from 'payload'
import config from '@/payload.config'

const escapeXML = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;')

const text = (value) => escapeXML(String(value || '').replace(/\s+/g, ' ').trim())
const amount = (value) => `${Number(value || 0).toFixed(2)} USD`

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

  const siteURL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://ginnynana.com').replace(/\/$/, '')
  const entries = products.flatMap((product) => {
    const image = typeof product.featuredImage === 'object' ? product.featuredImage : null
    if (!image?.url) return []
    const extraImages = (product.gallery || [])
      .map((item) => typeof item === 'object' ? item?.url : null)
      .filter(Boolean)
      .map((url) => `<g:additional_image_link>${text(new URL(url, siteURL).toString())}</g:additional_image_link>`)
      .join('')
    const variants = (product.variants || []).filter((variant) => variant.enabled !== false)
    const items = variants.length ? variants : [null]

    return items.map((variant) => {
      const currentPrice = Number(variant?.price ?? product.price)
      const comparePrice = Number(variant?.compareAtPrice ?? product.compareAtPrice ?? 0)
      const productURL = new URL(`/product/${encodeURIComponent(product.slug || product.id)}/`, siteURL)
      if (variant?.id) productURL.searchParams.set('variant', String(variant.id))
      const variantImage = variant?.image && typeof variant.image === 'object' ? variant.image : null
      const itemImageLink = new URL(variantImage?.url || image.url, siteURL).toString()
      const dimensions = variant ? [['shape', variant.shape], ['length', variant.length], ['size', (variant.size || 's').toUpperCase()]].filter(([, value]) => value) : []
      const title = `${product.title}${variant ? ` - ${[variant.shape, variant.length, (variant.size || 's').toUpperCase()].filter(Boolean).join(' ')}` : ''}`
      const availability = variant?.trackStock && Number(variant.stock || 0) < 1 ? 'out_of_stock' : 'in_stock'
      const gtin = variant?.gtin || product.gtin
      const mpn = variant?.mpn || product.mpn
      const sale = comparePrice > currentPrice ? `<g:sale_price>${amount(currentPrice)}</g:sale_price>` : ''
      const price = comparePrice > currentPrice ? comparePrice : currentPrice
      return `<item>
        <g:id>${text(`${product.id}-${variant?.id || 'default'}`)}</g:id>
        <g:item_group_id>${text(product.id)}</g:item_group_id>
        <g:title>${text(title)}</g:title>
        ${variant ? `<g:item_group_title>${text(product.title)}</g:item_group_title>` : ''}
        <g:description>${text(product.description)}</g:description>
        <g:link>${text(productURL.toString())}</g:link>
        <g:image_link>${text(itemImageLink)}</g:image_link>
        ${extraImages}
        <g:availability>${availability}</g:availability>
        <g:price>${amount(price)}</g:price>
        ${sale}
        <g:condition>new</g:condition>
        <g:brand>${text(product.brand || 'Ginny Nana')}</g:brand>
        ${gtin ? `<g:gtin>${text(gtin)}</g:gtin>` : ''}
        ${mpn ? `<g:mpn>${text(mpn)}</g:mpn>` : ''}
        ${!gtin && !mpn ? '<g:identifier_exists>false</g:identifier_exists>' : ''}
        ${product.googleProductCategory ? `<g:google_product_category>${text(product.googleProductCategory)}</g:google_product_category>` : ''}
        <g:product_type>${text(product.category || 'press-on-nails')}</g:product_type>
        ${variant ? `<g:size>${text((variant.size || 's').toUpperCase())}</g:size>` : ''}
        ${dimensions.map(([name, value]) => `<g:variant_option><g:name>${text(name)}</g:name><g:value>${text(value)}</g:value></g:variant_option>`).join('')}
      </item>`
    })
  })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Ginny Nana Products</title>
    <link>${text(siteURL)}</link>
    <description>Published Ginny Nana products</description>
    ${entries.join('\n')}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  })
}
