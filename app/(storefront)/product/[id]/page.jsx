import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getPriceDetails } from '@/lib/product-pricing'
import { productCanonical, productUrl, storefrontOrigin } from '@/lib/storefront-seo'
import { toStorefrontProduct } from '@/lib/storefront-product'
import { getPublishedCatalog, getStorefrontMarketingSettings } from '@/lib/storefront-catalog'
import ProductDetailClient from './ProductDetailClient'

export const dynamic = 'force-dynamic'

const findProduct = cache(async (id) => {
  const products = await getPublishedCatalog()
  return products.find((product) => product.slug === id || String(product.id) === id)
})

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
    alternates: { canonical: productCanonical(product) },
    ...(product.seoNoIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: { title: seoTitle, description: seoDescription || undefined },
  }
}

function productMarkup(product, description) {
  const variants = (product.variants || []).filter((variant) => variant.enabled !== false)
  const group = String(product.sku || product.id)
  const base = {
    name: product.title,
    description: description || undefined,
    brand: { '@type': 'Brand', name: product.brand || 'Ginny Nana' },
    color: product.color || undefined,
  }
  const entry = (variant) => {
    const pricing = getPriceDetails(product, variant)
    const image = variant?.image?.url || product.featuredImage?.url || product.gallery?.[0]?.url
    const url = productUrl(product, variant).href
    const dimensions = variant && [variant.length, variant.shape, (variant.size || 's').toUpperCase()].filter(Boolean)
    return {
      '@type': 'Product',
      ...base,
      name: variant ? [product.title, ...dimensions].join(' – ') : product.title,
      sku: String(variant?.sku || (variant ? `${group}-${variant.id}` : group)),
      image: image ? new URL(image, storefrontOrigin).href : undefined,
      size: variant ? (variant.size || 's').toUpperCase() : undefined,
      additionalProperty: variant ? Object.entries({ Length: variant.length, Shape: variant.shape, ...variant.attributes })
        .filter(([, value]) => value != null && value !== '')
        .map(([name, value]) => ({ '@type': 'PropertyValue', name, value: String(value) })) : undefined,
      url,
      offers: {
        '@type': 'Offer',
        url,
        priceCurrency: 'USD',
        price: pricing.currentPrice,
        availability: variant?.trackStock && Number(variant.stock || 0) < 1
          ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      },
    }
  }
  if (!product.variants?.length) return { '@context': 'https://schema.org', ...entry(null) }
  if (!variants.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'ProductGroup',
    ...base,
    url: productUrl(product).href,
    productGroupID: group,
    variesBy: ['https://schema.org/size'],
    hasVariant: variants.map(entry),
  }
}

export default async function ProductPage({ params, searchParams }) {
  const { id } = await params
  const product = await findProduct(id)
  if (!product) notFound()
  const { variant } = await searchParams
  const enabled = (product.variants || []).filter((item) => item.enabled !== false)
  const preferred = enabled.find((item) => String(item.id) === variant)
    || enabled.find((item) => String(item.size || 's').toLowerCase() === 's')
    || enabled[0]
  const metadata = await generateMetadata({ params })
  const markup = productMarkup(product, metadata.description)
  return <>
    {markup && !product.seoNoIndex && <script type="application/ld+json" dangerouslySetInnerHTML={{
      __html: JSON.stringify(markup).replace(/</g, '\\u003c'),
    }} />}
    <ProductDetailClient key={`${id}:${preferred?.id || ''}`} initialProduct={toStorefrontProduct(product)} initialVariant={preferred} />
  </>
}
