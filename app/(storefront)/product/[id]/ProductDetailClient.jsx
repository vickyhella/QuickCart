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

export default function ProductPage() {
  const { id } = useParams()
  const { products, addToCart, router, currency } = useAppContext()
  const product = products.find((item) => item._id === String(id) || item.slug === String(id))
  const [mainImage, setMainImage] = useState('')
  const [selectedLength, setSelectedLength] = useState('')
  const [selectedShape, setSelectedShape] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [added, setAdded] = useState(false)

  useEffect(() => setMainImage(''), [id])
  const variants = (product?.variants || []).filter((variant) => variant.enabled !== false)
  useEffect(() => {
    if (variants.length) {
      const preferredVariant = new URLSearchParams(window.location.search).get('variant')
      const initial = variants.find((variant) => String(variant.id) === preferredVariant) || variants[0]
      setSelectedLength(initial.length)
      setSelectedShape(initial.shape)
      setSelectedSize(initial.size || 's')
    } else {
      setSelectedLength('')
      setSelectedShape('')
      setSelectedSize('')
    }
  }, [id, product?.variants?.length])

  const selectedVariant = variants.find((variant) => variant.length === selectedLength && variant.shape === selectedShape && (variant.size || 's') === selectedSize)
  useEffect(() => {
    if (selectedVariant?.image?.url) setMainImage(selectedVariant.image.url)
    else setMainImage('')
  }, [selectedVariant?.id, selectedVariant?.image?.url])

  if (!products.length) return <main className="min-h-screen bg-[#fffdfa]"><Navbar /><p className="py-32 text-center text-[#786963]">Loading designs…</p><Footer /></main>
  if (!product) return <main className="min-h-screen bg-[#fffdfa]"><Navbar /><div className="py-32 text-center"><h1 className="font-serif text-3xl">This design is unavailable</h1><Link href="/all-products" className="inline-block mt-5 underline">Browse all designs</Link></div><Footer /></main>

  const money = (amount) => `${currency || '$'}${Number(amount).toFixed(2)}`
  const unitPrice = Number(selectedVariant?.price ?? product.offerPrice)
  const compareAtPrice = Number(selectedVariant?.compareAtPrice ?? product.price)
  const availableLengths = [...new Set(variants.filter((variant) => variant.shape === selectedShape && (variant.size || 's') === selectedSize).map((variant) => variant.length))]
  const availableShapes = [...new Set(variants.filter((variant) => variant.length === selectedLength && (variant.size || 's') === selectedSize).map((variant) => variant.shape))]
  const sizeOrder = ['xs', 's', 'm', 'l']
  const availableSizes = [...new Set(variants.filter((variant) => variant.length === selectedLength && variant.shape === selectedShape).map((variant) => variant.size || 's'))].sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b))
  const galleryImages = [...new Set([selectedVariant?.image?.url, ...product.image].filter(Boolean))]
  const chooseVariant = (dimension, value) => {
    const proposed = { length: selectedLength, shape: selectedShape, size: selectedSize, [dimension]: value }
    const matching = variants.find((variant) => variant.length === proposed.length && variant.shape === proposed.shape && (variant.size || 's') === proposed.size)
      || variants.find((variant) => variant[dimension] === value)
    if (matching) {
      setSelectedLength(matching.length)
      setSelectedShape(matching.shape)
      setSelectedSize(matching.size || 's')
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
            <div className="flex items-baseline gap-3 mt-5"><span className="text-xl">{money(unitPrice)}</span>{compareAtPrice > unitPrice && <span className="text-[#998f89] line-through">{money(compareAtPrice)}</span>}</div>
            {variants.length > 0 && <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-7">
              <label className="text-sm text-[#6e5c55]">Shape
                <select className="block w-full mt-2 rounded-lg border border-[#d8c9c1] bg-white px-3 py-2 capitalize" value={selectedShape} onChange={(event) => chooseVariant('shape', event.target.value)}>
                  {availableShapes.map((shape) => <option key={shape} value={shape}>{formatDimension(shape)}</option>)}
                </select>
              </label>
              <label className="text-sm text-[#6e5c55]">Length
                <select className="block w-full mt-2 rounded-lg border border-[#d8c9c1] bg-white px-3 py-2 capitalize" value={selectedLength} onChange={(event) => chooseVariant('length', event.target.value)}>
                  {availableLengths.map((length) => <option key={length} value={length}>{formatDimension(length)}</option>)}
                </select>
              </label>
              <label className="text-sm text-[#6e5c55]">Size
                <select className="block w-full mt-2 rounded-lg border border-[#d8c9c1] bg-white px-3 py-2 uppercase" value={selectedSize} onChange={(event) => chooseVariant('size', event.target.value)}>
                  {availableSizes.map((size) => <option key={size} value={size}>{size.toUpperCase()}</option>)}
                </select>
              </label>
            </div>}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full">
              <button disabled={(variants.length > 0 && !selectedVariant) || selectedOutOfStock} onClick={() => { addToCart(product._id, selectedVariant); setAdded(true); window.setTimeout(() => setAdded(false), 1800) }} className="w-full sm:flex-1 py-3.5 border border-[#754b43] text-[#754b43] rounded-full hover:bg-[#f8f3ef] disabled:opacity-50">{selectedOutOfStock ? 'Out of stock' : added ? 'Added to cart ✓' : 'Add to cart'}</button>
              <button disabled={(variants.length > 0 && !selectedVariant) || selectedOutOfStock} onClick={() => { addToCart(product._id, selectedVariant); router.push('/cart') }} className="w-full sm:flex-1 py-3.5 bg-[#754b43] text-white rounded-full hover:bg-[#5e3c36] disabled:opacity-50">Buy now</button>
            </div>
            <div className="product-markdown text-[#6e5c55] leading-7 mt-7">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                img: ({ src, alt }) => <img src={src || '/nail-placeholder.svg'} alt={alt || ''} onError={(event) => { event.currentTarget.src = '/nail-placeholder.svg' }} className="my-5 max-h-[30rem] max-w-full rounded-lg object-contain" loading="lazy" />,
                a: ({ href, children }) => <a href={href} className="underline underline-offset-2" rel={href?.startsWith('http') ? 'noreferrer' : undefined}>{children}</a>,
              }}>{product.description || ''}</ReactMarkdown>
            </div>
            <div className="grid grid-cols-2 gap-4 border-y border-[#e8ded8] py-5 mt-7 text-sm">
              <div><p className="text-[#998f89]">Shape</p><p className="mt-1">{formatDimension(selectedVariant?.shape || product.shape) || (variants.length ? 'Choose above' : 'Varies by set')}</p></div>
              <div><p className="text-[#998f89]">Length</p><p className="mt-1">{formatDimension(selectedVariant?.length || product.length) || (variants.length ? 'Choose above' : 'Varies by set')}</p></div>
              <div><p className="text-[#998f89]">Size</p><p className="mt-1 uppercase">{selectedVariant?.size || (variants.length ? 'Choose above' : 'Varies by set')}</p></div>
              <div><p className="text-[#998f89]">Set</p><p className="mt-1">Reusable press-on nails</p></div>
              {product.sku && <div><p className="text-[#998f89]">SKU</p><p className="mt-1">{product.sku}</p></div>}
            </div>
            <p className="text-xs text-[#827873] mt-5">Each set is handmade. Product details and sizing can be updated in the product manager.</p>
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
