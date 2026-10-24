import config from '@/payload.config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function GET() {
  const payload = await getPayload({ config })
  const settings = await payload.findGlobal({ slug: 'marketing-settings', depth: 1, overrideAccess: true }).catch(() => null) as Record<string, any> | null
  const image = settings?.homepageHeroImage
  const product = settings?.homepageHeroProduct
  const mysteryImage = settings?.homepageMysteryBoxImage
  let mysteryProduct = settings?.homepageMysteryBoxProduct
  if (!mysteryProduct) {
    const result = await payload.find({
      collection: 'products',
      where: { status: { equals: 'published' }, category: { equals: 'mystery-box' } },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    })
    mysteryProduct = result.docs[0] || null
  }
  const publishedProduct = product && typeof product === 'object' && product.status === 'published' ? product : null
  const publishedMysteryProduct = mysteryProduct && typeof mysteryProduct === 'object' && mysteryProduct.status === 'published' ? mysteryProduct : null
  return Response.json({
    imageUrl: image && typeof image === 'object' ? image.url || null : null,
    imageAlt: String(settings?.homepageHeroImageAlt || publishedProduct?.imageAlt?.[0] || publishedProduct?.name || publishedProduct?.title || ''),
    productHref: publishedProduct ? `/product/${publishedProduct.slug || publishedProduct.id}` : null,
    mysteryBox: publishedMysteryProduct ? {
      imageUrl: mysteryImage && typeof mysteryImage === 'object'
        ? mysteryImage.url || null
        : publishedMysteryProduct.image?.[0] || publishedProduct?.image?.[0] || '/media/ginny-nana-press-on-nails-test1-01.webp',
      imageAlt: String(settings?.homepageMysteryBoxImageAlt || publishedMysteryProduct.imageAlt?.[0] || publishedMysteryProduct.name || 'Mystery Box press-on nails'),
      href: `/product/${publishedMysteryProduct.slug || publishedMysteryProduct.id}`,
      eyebrow: String(settings?.homepageMysteryBoxEyebrow || 'A little surprise, just for you'),
      title: String(settings?.homepageMysteryBoxTitle || 'Meet your mystery box.'),
      description: String(settings?.homepageMysteryBoxDescription || 'A curated set, a little unexpected, and always made to feel like you.'),
    } : null,
  }, { headers: { 'Cache-Control': 'no-store' } })
}
