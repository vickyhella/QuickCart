'use client'

import { useEffect, useState } from 'react'
import SafeImage from '@/components/SafeImage'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { useAppContext } from '@/context/AppContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatDimension } from '@/lib/format-dimension'
import PaymentMethods from '@/components/PaymentMethods'
import { getPriceDetails } from '@/lib/product-pricing'
import { sortProductSizes } from '@/lib/product-size-order'
import { productVariantAttributeKeys } from '@/lib/product-color'

export default function ProductPage() {
  const { id } = useParams()
  const { products, productsStatus, fetchProductData, addToCart, router, currency } = useAppContext()
  const product = products.find((item) => item._id === String(id) || item.slug === String(id))
  const [mainImage, setMainImage] = useState('')
  const [selectedLength, setSelectedLength] = useState('')
  const [selectedShape, setSelectedShape] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedAttributes, setSelectedAttributes] = useState({})
  const [added, setAdded] = useState(false)

  useEffect(() => setMainImage(''), [id])
  const variants = (product?.variants || []).filter((variant) => variant.enabled !== false)
  useEffect(() => {
    if (variants.length) {
      const preferredVariant = new URLSearchParams(window.location.search).get('variant')
      const initial = variants.find((variant) => String(variant.id) === preferredVariant) || variants[0]
      setSelectedLength(initial.length || '')
      setSelectedShape(initial.shape || '')
      setSelectedSize(initial.size || 's')
      setSelectedAttributes(initial.attributes || {})
    } else {
      setSelectedLength('')
      setSelectedShape('')
      setSelectedSize('')
      setSelectedAttributes({})
    }
  }, [id, product?.variants?.length])

  const attributeKeys = productVariantAttributeKeys(variants)
  const selectedVariant = variants.find((variant) => (variant.length || '') === selectedLength && (variant.shape || '') === selectedShape && (variant.size || 's') === selectedSize && attributeKeys.every((key) => String(variant.attributes?.[key] ?? '') === String(selectedAttributes[key] ?? '')))
  useEffect(() => {
    if (selectedVariant?.image?.url) setMainImage(selectedVariant.image.url)
    else setMainImage('')
  }, [selectedVariant?.id, selectedVariant?.image?.url])

  if (productsStatus === 'loading') return <main className="min-h-screen bg-[#fffdfa]"><Navbar /><p className="py-32 text-center text-[#786963]" role="status">Loading designs…</p><Footer /></main>
  if (productsStatus === 'error') return <main className="min-h-screen bg-[#fffdfa]"><Navbar /><div className="py-32 text-center text-[#786963]" role="alert"><p>We couldn’t load this design.</p><button type="button" onClick={fetchProductData} className="mt-3 underline">Try again</button></div><Footer /></main>
  if (!product) return <main className="min-h-screen bg-[#fffdfa]"><Navbar /><div className="py-32 text-center"><h1 className="font-serif text-3xl">This design is unavailable</h1><Link href="/all-products" className="inline-block mt-5 underline">Browse all designs</Link></div><Footer /></main>

  const money = (amount) => `${currency || '$'}${Number(amount).toFixed(2)}`
  const pricing = getPriceDetails(product, selectedVariant)
  const availableLengths = [...new Set(variants.filter((variant) => variant.shape === selectedShape && (variant.size || 's') === selectedSize).map((variant) => variant.length).filter(Boolean))]
  const availableShapes = [...new Set(variants.filter((variant) => variant.length === selectedLength && (variant.size || 's') === selectedSize).map((variant) => variant.shape).filter(Boolean))]
  const matchesAttributes = (variant) => attributeKeys.every((key) => String(variant.attributes?.[key] ?? '') === String(selectedAttributes[key] ?? ''))
  const availableSizes = sortProductSizes(variants.filter((variant) => (!selectedLength || variant.length === selectedLength) && (!selectedShape || variant.shape === selectedShape) && matchesAttributes(variant)).map((variant) => variant.size || 's'))
  const galleryImages = [...new Set([selectedVariant?.image?.url, ...product.image].filter(Boolean))]
  const chooseVariant = (dimension, value) => {
    const proposedAttributes = dimension.startsWith('attribute:') ? { ...selectedAttributes, [dimension.slice(10)]: value } : selectedAttributes
    const proposed = { length: selectedLength, shape: selectedShape, size: selectedSize, [dimension]: value }
    const matching = variants.find((variant) => (variant.length || '') === proposed.length && (variant.shape || '') === proposed.shape && (variant.size || 's') === proposed.size && attributeKeys.every((key) => String(variant.attributes?.[key] ?? '') === String(proposedAttributes[key] ?? '')))
      || variants.find((variant) => variant[dimension] === value)
    if (matching) {
      setSelectedLength(matching.length)
      setSelectedShape(matching.shape)
      setSelectedSize(matching.size || 's')
      setSelectedAttributes(matching.attributes || proposedAttributes)
    }
  }
  const selectedOutOfStock = Boolean(selectedVariant?.trackStock && Number(selectedVariant.stock || 0) < 1)

  return (
    <main className="bg-[#fffdfa] text-[#302522] min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-8 sm:py-10 md:py-14">
        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:gap-12">
          <div className="mx-auto w-full max-w-[520px]">
            <div className="aspect-[4/5] max-h-[650px] bg-[#f5f0ec] rounded-xl overflow-hidden">
              <SafeImage unoptimized src={mainImage || selectedVariant?.image?.url || product.image[0]} alt={selectedVariant?.image?.altText || product.imageAlt?.[Math.max(0, product.image.indexOf(mainImage || product.image[0]))] || product.name} width={800} height={1000} className="w-full h-full object-contain p-3 sm:p-5" priority sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 520px" />
            </div>
            {galleryImages.length > 1 && <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3 mt-3">{galleryImages.map((image, index) => <button key={image + index} onClick={() => setMainImage(image)} className="aspect-square rounded-lg overflow-hidden bg-[#f5f0ec] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#754b43]"><SafeImage unoptimized src={image} alt={product.imageAlt?.[Math.max(0, product.image.indexOf(image))] || `${product.name} view ${index + 1}`} width={160} height={160} className="w-full h-full object-contain p-1" /></button>)}</div>}
          </div>
          <div className="min-w-0 w-full max-w-2xl lg:py-3">
            <p className="text-xs uppercase tracking-[0.24em] text-[#9a756d]">Handmade press-on nails</p>
            <h1 className="font-serif text-3xl md:text-4xl mt-3">{product.name}</h1>
            <div className="flex items-baseline gap-3 mt-5"><span className="text-xl">{money(pricing.currentPrice)}</span>{pricing.onSale && <span className="text-[#998f89] line-through">{money(pricing.price)}</span>}</div>
            {variants.length > 0 && <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-7">
              {availableShapes.length > 0 && <label className="text-sm text-[#6e5c55]">Shape
                <select className="block w-full mt-2 rounded-lg border border-[#d8c9c1] bg-white px-3 py-2 capitalize" value={selectedShape} onChange={(event) => chooseVariant('shape', event.target.value)}>
                  {availableShapes.map((shape) => <option key={shape} value={shape}>{formatDimension(shape)}</option>)}
                </select>
              </label>}
              {availableLengths.length > 0 && <label className="text-sm text-[#6e5c55]">Length
                <select className="block w-full mt-2 rounded-lg border border-[#d8c9c1] bg-white px-3 py-2 capitalize" value={selectedLength} onChange={(event) => chooseVariant('length', event.target.value)}>
                  {availableLengths.map((length) => <option key={length} value={length}>{formatDimension(length)}</option>)}
                </select>
              </label>}
              <label className="text-sm text-[#6e5c55]">Size
                <select className="block w-full mt-2 rounded-lg border border-[#d8c9c1] bg-white px-3 py-2 uppercase" value={selectedSize} onChange={(event) => chooseVariant('size', event.target.value)}>
                  {availableSizes.map((size) => <option key={size} value={size}>{size.toUpperCase()}</option>)}
                </select>
              </label>
              {attributeKeys.map((key) => {
                const values = [...new Set(variants.map((variant) => variant.attributes?.[key]).filter((value) => value !== undefined && value !== null))]
                return <label key={key} className="text-sm text-[#6e5c55]">{formatDimension(key)}
                  <select className="block w-full mt-2 rounded-lg border border-[#d8c9c1] bg-white px-3 py-2" value={String(selectedAttributes[key] ?? '')} onChange={(event) => chooseVariant(`attribute:${key}`, event.target.value)}>
                    {values.map((value) => <option key={String(value)} value={String(value)}>{String(value)}</option>)}
                  </select>
                </label>
              })}
            </div>}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full">
              <button disabled={(variants.length > 0 && !selectedVariant) || selectedOutOfStock} onClick={() => { addToCart(product._id, selectedVariant); setAdded(true); window.setTimeout(() => setAdded(false), 1800) }} className="ui-button ui-button--secondary w-full sm:flex-1">{selectedOutOfStock ? 'Out of stock' : added ? 'Added to cart ✓' : 'Add to cart'}</button>
              <button disabled={(variants.length > 0 && !selectedVariant) || selectedOutOfStock} onClick={() => { addToCart(product._id, selectedVariant); router.push('/cart') }} className="ui-button ui-button--primary w-full sm:flex-1">Buy now</button>
            </div>
            <PaymentMethods className="mt-3" />
            <div className="product-markdown text-[#6e5c55] leading-7 mt-7">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                img: ({ src, alt }) => <img src={src || '/nail-placeholder.svg'} alt={alt || ''} onError={(event) => { event.currentTarget.src = '/nail-placeholder.svg' }} className="my-5 max-h-[30rem] max-w-full rounded-lg object-contain" loading="lazy" />,
                a: ({ href, children }) => <a href={href} className="underline underline-offset-2" rel={href?.startsWith('http') ? 'noreferrer' : undefined}>{children}</a>,
              }}>{product.description || ''}</ReactMarkdown>
            </div>
            <div className="grid grid-cols-2 gap-4 border-y border-[#e8ded8] py-5 mt-7 text-sm">
              {(selectedVariant?.shape || product.shape) && <div><p className="text-[#998f89]">Shape</p><p className="mt-1">{formatDimension(selectedVariant?.shape || product.shape)}</p></div>}
              {(selectedVariant?.length || product.length) && <div><p className="text-[#998f89]">Length</p><p className="mt-1">{formatDimension(selectedVariant?.length || product.length)}</p></div>}
              <div><p className="text-[#998f89]">Size</p><p className="mt-1 uppercase">{selectedVariant?.size || (variants.length ? 'Choose above' : 'Varies by set')}</p></div>
              {attributeKeys.map((key) => <div key={key}><p className="text-[#998f89]">{formatDimension(key)}</p><p className="mt-1">{selectedVariant?.attributes?.[key] ?? '—'}</p></div>)}
              <div><p className="text-[#998f89]">Set</p><p className="mt-1">Reusable press-on nails</p></div>
              {product.sku && <div><p className="text-[#998f89]">SKU</p><p className="mt-1">{product.sku}</p></div>}
            </div>
          </div>
        </div>
      </section>
      <section className="px-5 md:px-12 lg:px-20 py-12 bg-[#f8f3ef]">
        <div className="flex items-end justify-between"><h2 className="font-serif text-3xl">You may also like</h2><Link href="/all-products" className="text-sm underline underline-offset-4">Shop all</Link></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-7 mt-7">{products.filter((item) => item._id !== product._id).slice(0, 4).map((item) => <ProductCard key={item._id} product={item} />)}</div>
      </section>
      <Footer />
    </main>
  )
}
