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
      const dimensions = variant ? [['Shape', variant.shape], ['Length', variant.length], ['Size', (variant.size || 's').toUpperCase()]].filter(([, value]) => value) : []
      const title = `${product.title}${variant ? ` - ${[variant.shape, variant.length, (variant.size || 's').toUpperCase()].filter(Boolean).join(' ')}` : ''}`
      const availability = variant?.trackStock && Number(variant.stock || 0) < 1 ? 'out_of_stock' : 'in_stock'
      const gtin = product.gtin
      const mpn = product.mpn
      const sale = comparePrice > currentPrice ? `<g:sale_price>${amount(currentPrice)}</g:sale_price>` : ''
      const price = comparePrice > currentPrice ? comparePrice : currentPrice
      return `<item>
        <g:id>${text(`${product.id}-${variant?.id || 'default'}`)}</g:id>
        <g:item_group_id>${text(product.id)}</g:item_group_id>
        <g:title>${text(title)}</g:title>
        <g:description>${text(String(product.description || '').replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[`*_>#~-]/g, ' '))}</g:description>
        <g:link>${text(productURL.toString())}</g:link>
        <g:image_link>${text(itemImageLink)}</g:image_link>
        ${extraImages}
        <g:availability>${availability}</g:availability>
        <g:price>${amount(price)}</g:price>
        ${sale}
        <g:condition>${text(product.condition || 'new')}</g:condition>
        <g:brand>${text(product.brand || 'Ginny Nana')}</g:brand>
        ${gtin ? `<g:gtin>${text(gtin)}</g:gtin>` : ''}
        ${mpn ? `<g:mpn>${text(mpn)}</g:mpn>` : ''}
        ${!gtin && !mpn ? '<g:identifier_exists>false</g:identifier_exists>' : ''}
        <g:google_product_category>${text(product.googleProductCategory || 'Health & Beauty > Personal Care > Cosmetics > Nail Care > False Nails')}</g:google_product_category>
        <g:product_type>Press-on Nails</g:product_type>
        <g:age_group>${text(product.ageGroup || 'adult')}</g:age_group>
        <g:adult>${product.adult === true ? 'yes' : 'no'}</g:adult>
        <g:gender>${text(product.gender || 'unisex')}</g:gender>
        ${product.color ? `<g:color>${text(product.color)}</g:color>` : ''}
        <g:material>${text(product.material || 'ABS Plastic')}</g:material>
        ${variant ? `<g:size>${text((variant.size || 's').toUpperCase())}</g:size>` : ''}
        ${product.multipack && Number(product.multipack) > 1 ? `<g:multipack>${Math.floor(Number(product.multipack))}</g:multipack>` : ''}
        ${dimensions.map(([name, value]) => `<g:product_detail><g:section_name>Variant</g:section_name><g:attribute_name>${text(name)}</g:attribute_name><g:attribute_value>${text(value)}</g:attribute_value></g:product_detail>`).join('')}
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
