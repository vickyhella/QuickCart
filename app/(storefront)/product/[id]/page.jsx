import { getPublishedCatalog, getStorefrontMarketingSettings } from '@/lib/storefront-catalog'
import ProductDetailClient from './ProductDetailClient'

export const dynamic = 'force-dynamic'

async function findProduct(id) {
  const products = await getPublishedCatalog()
  return products.find((product) => product.slug === id || String(product.id) === id)
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const product = await findProduct(id)
  if (!product) return { title: 'Product not found | Ginny Nana' }
  const marketing = !product.seoTitle || !product.seoDescription ? await getStorefrontMarketingSettings() : null
  const values = {
    brand: String(product.brand || 'Ginny Nana'),
    productType: String(product.category || 'press-on-nails').replaceAll('-', ' '),
    productName: String(product.title || ''),
    length: String(product.length || ''),
    shape: String(product.shape || ''),
    size: '',
  }
  const render = (template) => String(template || '').replace(/\{(brand|productType|productName|length|shape|size)\}/g, (_, token) => values[token] || '').replace(/\s+/g, ' ').trim()
  const seoTitle = product.seoTitle || render(marketing?.productTitleTemplate) || `${product.title} | Ginny Nana`
  const seoDescription = product.seoDescription || render(marketing?.productDescriptionTemplate) || String(product.description || '').replace(/[#*_`>\[\]()!~-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
  return {
    title: seoTitle,
    description: seoDescription,
    ...(product.seoCanonicalUrl ? { alternates: { canonical: product.seoCanonicalUrl } } : {}),
    ...(product.seoNoIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: { title: seoTitle, description: seoDescription || undefined },
  }
}

export default function ProductPage() {
  return <ProductDetailClient />
}
