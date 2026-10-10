import { getPayload } from 'payload'
import config from '@/payload.config'
import ProductDetailClient from './ProductDetailClient'

export const dynamic = 'force-dynamic'

async function findProduct(id) {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'products',
    where: { and: [{ or: [{ slug: { equals: id } }, { id: { equals: id } }] }, { status: { equals: 'published' } }] },
    limit: 1,
    overrideAccess: false,
  })
  return result.docs[0]
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const product = await findProduct(id)
  if (!product) return { title: 'Product not found | Ginny Nana' }
  return {
    title: product.seoTitle || `${product.title} | Ginny Nana`,
    description: product.seoDescription || String(product.description || '').replace(/[#*_`>\[\]()!~-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160),
    openGraph: { title: product.seoTitle || product.title, description: product.seoDescription || undefined },
  }
}

export default function ProductPage() {
  return <ProductDetailClient />
}
