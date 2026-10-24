import config from '@/payload.config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function GET() {
  const payload = await getPayload({ config })
  const settings = await payload.findGlobal({ slug: 'marketing-settings', depth: 1, overrideAccess: true }) as Record<string, any>
  const image = settings?.homepageHeroImage
  const product = settings?.homepageHeroProduct
  const mysteryImage = settings?.homepageMysteryBoxImage
  let mysteryProduct = settings?.homepageMysteryBoxProduct
  if (!mysteryProduct) {
    try {
      const result = await payload.find({
        collection: 'products',
        where: { status: { equals: 'published' }, category: { equals: 'mystery-box' } },
        limit: 1,
        depth: 1,
        overrideAccess: true,
      })
      mysteryProduct = result.docs[0] || null
    } catch (error) {
      console.error('Homepage Mystery Box fallback lookup failed:', error)
      mysteryProduct = null
    }
  }
  const publishedProduct = product && typeof product === 'object' && product.status === 'published' ? product : null
  const publishedMysteryProduct = mysteryProduct && typeof mysteryProduct === 'object' && mysteryProduct.status === 'published' ? mysteryProduct : null
  const productImage = (item: Record<string, any> | null) => {
    const featuredImage = item?.featuredImage
    if (featuredImage && typeof featuredImage === 'object' && featuredImage.url) return featuredImage.url
    const galleryImage = Array.isArray(item?.gallery) ? item.gallery[0] : null
    return galleryImage && typeof galleryImage === 'object' ? galleryImage.url || null : null
  }
  return Response.json({
    imageUrl: image?.url || productImage(publishedProduct),
    imageAlt: String(settings?.homepageHeroImageAlt || publishedProduct?.imageAlt?.[0] || publishedProduct?.name || publishedProduct?.title || ''),
    productHref: publishedProduct ? `/product/${publishedProduct.slug || publishedProduct.id}` : null,
    mysteryBox: publishedMysteryProduct ? {
      imageUrl: mysteryImage?.url || productImage(publishedMysteryProduct) || productImage(publishedProduct) || '/media/ginny-nana-press-on-nails-test1-01.webp',
      imageAlt: String(settings?.homepageMysteryBoxImageAlt || publishedMysteryProduct.imageAlt?.[0] || publishedMysteryProduct.name || 'Mystery Box press-on nails'),
      href: `/product/${publishedMysteryProduct.slug || publishedMysteryProduct.id}`,
      eyebrow: String(settings?.homepageMysteryBoxEyebrow || 'A little surprise, just for you'),
      title: String(settings?.homepageMysteryBoxTitle || 'Meet your mystery box.'),
      description: String(settings?.homepageMysteryBoxDescription || 'A curated set, a little unexpected, and always made to feel like you.'),
    } : null,
  }, { headers: { 'Cache-Control': 'no-store' } })
}
