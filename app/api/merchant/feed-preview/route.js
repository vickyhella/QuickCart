import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { shippingCountries } from '@/lib/countries'
import { getPublishedCatalog, getStorefrontMarketingSettings } from '@/lib/storefront-catalog'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const payload = await getPayload({ config })
  const [published, { totalDocs }, marketing] = await Promise.all([
    getPublishedCatalog(), payload.count({ collection: 'products', overrideAccess: true }), getStorefrontMarketingSettings(),
  ])
  const allowedCountries = Array.isArray(marketing?.availableCountries) && marketing.availableCountries.length ? marketing.availableCountries : shippingCountries.map(([code]) => code)
  let itemCount = 0
  const skipped = []

  for (const product of published) {
    const productImage = product.featuredImage?.url || product.gallery?.[0]?.url || null
    const variants = (product.variants || []).filter((variant) => variant.enabled !== false)
    const offers = variants.length ? variants : [null]
    const validOffers = offers.filter((variant) => {
      const variantImage = variant?.image?.url || null
      return Boolean(variantImage || productImage)
    })
    itemCount += validOffers.length
    if (!validOffers.length) skipped.push({ title: product.title, slug: product.slug, reason: variants.length ? 'No enabled variant or product image' : 'Product image is missing' })
  }

  return NextResponse.json({
    totalProducts: totalDocs,
    publishedProducts: published.length,
    draftProducts: totalDocs - published.length,
    feedItems: itemCount,
    skippedPublishedProducts: skipped,
    availableCountries: shippingCountries.filter(([code]) => allowedCountries.includes(code)).map(([code, name]) => ({ code, name })),
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } })
}
