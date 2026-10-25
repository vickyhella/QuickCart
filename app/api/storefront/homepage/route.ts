import config from '@/payload.config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import { getPublishedCatalog, getStorefrontMarketingSettings } from '@/lib/storefront-catalog'
import { STOREFRONT_CACHE_SECONDS, STOREFRONT_SETTINGS_TAG } from '@/lib/storefront-cache'

export const dynamic = 'force-dynamic'

const getHomepageImages = unstable_cache(async (imageIDs: string[]) => {
  const payload = await getPayload({ config })
  const images = await payload.find({
    collection: 'media', where: { id: { in: imageIDs } }, limit: imageIDs.length,
    depth: 0, select: { url: true, altText: true }, overrideAccess: true,
  })
  return images.docs
}, ['storefront-homepage-images-v1'], { revalidate: STOREFRONT_CACHE_SECONDS, tags: [STOREFRONT_SETTINGS_TAG] })

async function getHomepageData() {
  // Keep these cache scopes separate: Next bypasses nested unstable_cache readers.
  const [settings, products] = await Promise.all([getStorefrontMarketingSettings(), getPublishedCatalog()])
  const relationID = (value: any) => String(value && typeof value === 'object' ? value.id : value ?? '')
  const imageIDs = [settings.homepageHeroImage, settings.homepageMysteryBoxImage].map(relationID).filter(Boolean)
  const images = imageIDs.length ? await getHomepageImages(imageIDs) : []
  const image = images.find((item) => String(item.id) === relationID(settings.homepageHeroImage))
  const mysteryImage = images.find((item) => String(item.id) === relationID(settings.homepageMysteryBoxImage))
  const publishedProduct = products.find((item) => String(item.id) === relationID(settings.homepageHeroProduct)) || null
  const publishedMysteryProduct = settings.homepageMysteryBoxProduct
    ? products.find((item) => String(item.id) === relationID(settings.homepageMysteryBoxProduct)) || null
    : products.find((item) => item.category === 'mystery-box') || null
  const productImage = (item: Record<string, any> | null) => {
    const featuredImage = item?.featuredImage
    if (featuredImage && typeof featuredImage === 'object' && featuredImage.url) return featuredImage.url
    const galleryImage = Array.isArray(item?.gallery) ? item.gallery[0] : null
    return galleryImage && typeof galleryImage === 'object' ? galleryImage.url || null : null
  }
  return {
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
  }
}

export async function GET() {
  return Response.json(await getHomepageData(), { headers: { 'Cache-Control': 'no-store' } })
}
