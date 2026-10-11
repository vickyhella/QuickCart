import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { shippingCountries } from '@/lib/countries'
import { resolveProductMedia } from '@/lib/resolve-product-media'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'products',
    limit: 10000,
    pagination: false,
    depth: 1,
    overrideAccess: true,
  })
  const products = await resolveProductMedia(payload, result.docs)
  const marketing = await payload.findGlobal({ slug: 'marketing-settings', overrideAccess: true }).catch(() => null)
  const allowedCountries = Array.isArray(marketing?.availableCountries) && marketing.availableCountries.length ? marketing.availableCountries : shippingCountries.map(([code]) => code)
  const published = products.filter((product) => product.status === 'published')
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
    totalProducts: products.length,
    publishedProducts: published.length,
    draftProducts: products.length - published.length,
    feedItems: itemCount,
    skippedPublishedProducts: skipped,
    availableCountries: shippingCountries.filter(([code]) => allowedCountries.includes(code)).map(([code, name]) => ({ code, name })),
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } })
}
