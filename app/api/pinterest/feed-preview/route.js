import { NextResponse } from 'next/server'
import { getPublishedCatalog } from '@/lib/storefront-catalog'

export const dynamic = 'force-dynamic'

export async function GET() {
  const products = await getPublishedCatalog()
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
  return NextResponse.json({ publishedProducts: products.length, feedItems, skippedPublishedProducts }, { headers: { 'Cache-Control': 'no-store' } })
}
