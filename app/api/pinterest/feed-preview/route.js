import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { resolveProductMedia } from '@/lib/resolve-product-media'

export const dynamic = 'force-dynamic'

export async function GET() {
  const payload = await getPayload({ config })
  const result = await payload.find({ collection: 'products', where: { status: { equals: 'published' } }, limit: 10000, pagination: false, depth: 1, overrideAccess: true })
  const products = await resolveProductMedia(payload, result.docs)
  let feedItems = 0
  const skippedPublishedProducts = []
  for (const product of products) {
    const image = product.featuredImage && typeof product.featuredImage === 'object' ? product.featuredImage.url : null
    const gallery = (product.gallery || []).some((item) => item && typeof item === 'object' && item.url)
    const variants = (product.variants || []).filter((variant) => variant.enabled !== false)
    const offers = variants.length ? variants : [null]
    const valid = offers.filter((variant) => Boolean(variant?.image?.url || image || gallery))
    feedItems += valid.length
    if (!valid.length) skippedPublishedProducts.push({ title: product.title, reason: 'Product has no image' })
  }
  return NextResponse.json({ publishedProducts: result.docs.length, feedItems, skippedPublishedProducts }, { headers: { 'Cache-Control': 'no-store' } })
}
