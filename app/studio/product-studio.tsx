'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import toast from 'react-hot-toast'
import { readJSONResponse } from '@/lib/read-json-response'
import { DEFAULT_STUDIO_DESCRIPTION_TEMPLATE, renderStudioDescription } from '@/lib/studio-description-template'

type ProductRow = {
  id: string | number
  title: string
  sku?: string | null
  price?: number | null
  status: string
  updatedAt: string
  variantCount: number
  image: string | null
}

type ProductResponse = {
  docs: ProductRow[]
  page: number
  totalPages: number
  totalDocs: number
  templates?: { description: string; seoTitle: string; seoDescription: string }
}
type StudioImage = { id: string | number; url: string; name: string; existing?: boolean }

const responseData = readJSONResponse

const categories = [
  ['press-on-nails', 'Press-on Nails'],
  ['nail-care', 'Nail Care'],
  ['accessories', 'Accessories'],
  ['mystery-box', 'Mystery Box'],
]

function fillTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{([^}]+)\}/g, (_, key: string) => values[key] || '').replace(/\s+/g, ' ').trim()
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-sm font-medium text-[#423735]">{children}</label>
}

const inputClass = 'w-full rounded-xl border border-[#e7ddd8] bg-white px-4 py-3 text-sm text-[#302522] outline-none transition focus:border-[#b57d72] focus:ring-2 focus:ring-[#b57d72]/15'

export default function ProductStudio() {
  const requestID = useRef('')
  const [products, setProducts] = useState<ProductRow[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDocs, setTotalDocs] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('-updatedAt')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [templates, setTemplates] = useState({
    description: DEFAULT_STUDIO_DESCRIPTION_TEMPLATE,
    seoTitle: '{brand} {productType} {productName} {availableLengthShapeCombinations}',
    seoDescription: '{productName} press-on nails by {brand}.',
  })
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('press-on-nails')
  const [price, setPrice] = useState('')
  const [supplierSKU, setSupplierSKU] = useState('')
  const [purchaseURL, setPurchaseURL] = useState('')
  const [descriptionMode, setDescriptionMode] = useState<'auto' | 'custom'>('auto')
  const [description, setDescription] = useState('')
  const [seoTitleMode, setSeoTitleMode] = useState<'auto' | 'custom'>('auto')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescriptionMode, setSeoDescriptionMode] = useState<'auto' | 'custom'>('auto')
  const [seoDescription, setSeoDescription] = useState('')
  const [images, setImages] = useState<StudioImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [imageDropActive, setImageDropActive] = useState(false)
  const [length, setLength] = useState('medium')
  const [shape, setShape] = useState('almond')
  const [combinations, setCombinations] = useState<{ length: string; shape: string }[]>([])
  const [sizes, setSizes] = useState<string[]>(['xs', 's', 'm', 'l'])
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({})
  const [imageOverrides, setImageOverrides] = useState<Record<string, string>>({})
  const [stockOverrides, setStockOverrides] = useState<Record<string, number>>({})
  const [variantSupplierSKUs, setVariantSupplierSKUs] = useState<Record<string, string>>({})
  const [variantPurchaseURLs, setVariantPurchaseURLs] = useState<Record<string, string>>({})
  const [variantEnabled, setVariantEnabled] = useState<Record<string, boolean>>({})
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [editingUpdatedAt, setEditingUpdatedAt] = useState('')
  const [editingStatus, setEditingStatus] = useState('draft')
  const [selectedIDs, setSelectedIDs] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Record<string, ProductRow>>({})
  const [bulkPrice, setBulkPrice] = useState('')
  const [bulkStock, setBulkStock] = useState('')
  const [bulkStatus, setBulkStatus] = useState('')
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [librarySearch, setLibrarySearch] = useState('')
  const [libraryPage, setLibraryPage] = useState(1)
  const [libraryImages, setLibraryImages] = useState<StudioImage[]>([])
  const [libraryTotalPages, setLibraryTotalPages] = useState(1)
  const [librarySelected, setLibrarySelected] = useState<string[]>([])

  const enabledCombinations = combinations.filter((combo) => sizes.some((size) => variantEnabled[`${combo.length}|${combo.shape}|${size}`] !== false))
  const enabledSizes = sizes.filter((size) => enabledCombinations.some((combo) => variantEnabled[`${combo.length}|${combo.shape}|${size}`] !== false))
  const combinationLengths = [...new Set(enabledCombinations.map((item) => item.length))].join(', ')
  const combinationShapes = [...new Set(enabledCombinations.map((item) => item.shape))].join(', ')
  const availableCombinations = enabledCombinations.map((item) => `${item.length} ${item.shape}`).join(', ')
  const availableSizes = enabledSizes.join(', ').toUpperCase()
  const autoDescription = useMemo(() => title.trim()
    ? renderStudioDescription(templates.description, { brand: 'Ginny Nana', productType: category.replaceAll('-', ' '), productName: title.trim(), length: combinationLengths, shape: combinationShapes, availableLengthShapeCombinations: availableCombinations, availableSizes })
    : 'Enter a product name to preview its description.', [templates.description, title, category, combinationLengths, combinationShapes, availableCombinations, availableSizes])
  const autoSeoTitle = fillTemplate(templates.seoTitle, {
    brand: 'Ginny Nana',
    productType: category.replaceAll('-', ' '),
    productName: title.trim(),
    length: combinationLengths,
    shape: combinationShapes,
    availableLengthShapeCombinations: availableCombinations,
    availableSizes,
  })
  const autoSeoDescription = fillTemplate(templates.seoDescription, {
    brand: 'Ginny Nana',
    productType: category.replaceAll('-', ' '),
    productName: title.trim(),
    length: combinationLengths,
    shape: combinationShapes,
    availableLengthShapeCombinations: availableCombinations,
    availableSizes,
  })

  useEffect(() => {
    let active = true
    const params = new URLSearchParams({ page: String(page), status, sort })
    if (search.trim()) params.set('search', search.trim())
    setLoading(true)
    setError('')
    fetch(`/api/studio/products?${params}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Could not load products.')
        return data as ProductResponse
      })
      .then((data) => {
        if (!active) return
        setProducts(data.docs)
        setTotalPages(data.totalPages || 1)
        setTotalDocs(data.totalDocs || 0)
        if (data.templates) setTemplates(data.templates)
      })
      .catch((cause: Error) => { if (active) setError(cause.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, search, status, sort])

  async function saveDraft(addAnother: boolean, action: 'draft' | 'publish' = 'draft') {
    if (!editingId && !requestID.current) requestID.current = crypto.randomUUID()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch(editingId ? `/api/studio/products/${editingId}` : '/api/studio/products', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestID: editingId ? undefined : requestID.current, updatedAt: editingUpdatedAt, title, category, price, supplierSKU, purchaseURL, descriptionMode, description, seoTitleMode, seoTitle, seoDescriptionMode, seoDescription, mediaIDs: images.map((image) => image.id), combinations, sizes, variants: combinations.flatMap((combo) => sizes.map((size) => { const key = `${combo.length}|${combo.shape}|${size}`; return { ...combo, size, stock: stockOverrides[key] ?? 10, enabled: variantEnabled[key] !== false, price: priceOverrides[key], image: imageOverrides[key], supplierSKU: variantSupplierSKUs[key], purchaseURL: variantPurchaseURLs[key] } })), action }),
      })
      const data = await responseData(response)
      const wasEditing = Boolean(editingId)
      if (!wasEditing) requestID.current = ''
      setEditingId(null); setEditingUpdatedAt(''); setEditingStatus('draft')
      setTitle(''); setSupplierSKU(''); setPurchaseURL(''); setImages([]); setPrice(''); setDescription(''); setSeoTitle(''); setSeoDescription('')
      setDescriptionMode('auto'); setSeoTitleMode('auto'); setSeoDescriptionMode('auto'); setPriceOverrides({}); setImageOverrides({}); setStockOverrides({}); setVariantSupplierSKUs({}); setVariantPurchaseURLs({}); setVariantEnabled({})
      if (wasEditing) { setCombinations([]); setSizes(['xs', 's', 'm', 'l']) }
      const successMessage = action === 'publish' ? 'Product published.' : addAnother ? 'Draft saved. Your next product form is ready.' : wasEditing ? 'Product changes saved.' : 'Draft saved.'
      setNotice(successMessage)
      toast.success(successMessage)
      setPage(1)
      const params = new URLSearchParams({ page: '1', status, sort })
      if (search.trim()) params.set('search', search.trim())
      const refresh = await fetch(`/api/studio/products?${params}`, { cache: 'no-store' })
      try {
      const result = await responseData(refresh)
        setProducts(result.docs)
        setTotalPages(result.totalPages || 1)
        setTotalDocs(result.totalDocs || 0)
      } catch { setNotice((current) => `${current} List refresh failed; your changes were saved.`) }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the draft.')
    } finally {
      setSaving(false)
    }
  }

  async function uploadImages(files: FileList | null) {
    if (!files?.length) return
    setUploading(true); setError('')
    const failures: string[] = []
    try {
      for (const file of Array.from(files)) {
        const form = new FormData(); form.set('file', file); form.set('studioTemporary', 'true'); form.set('studioProductName', title.trim()); form.set('studioProductType', category)
        try {
          const response = await fetch('/api/media', { method: 'POST', body: form })
          const data = await response.json()
          if (!response.ok) throw new Error(data.errors?.[0]?.message || 'Image upload failed.')
          setImages((current) => [...current, { id: data.doc.id, url: data.doc.url, name: data.doc.filename || file.name }])
        } catch (cause) { failures.push(`${file.name}: ${cause instanceof Error ? cause.message : 'upload failed'}`) }
      }
      if (failures.length) setError(`Some images could not be uploaded. Successful images remain attached to this form. ${failures.join(' · ')}`)
    }
    finally { setUploading(false) }
  }

  async function removeImage(image: StudioImage) {
    if (image.existing) { setImages((current) => current.filter((item) => item.id !== image.id)); setImageOverrides((current) => Object.fromEntries(Object.entries(current).filter(([, mediaID]) => String(mediaID) !== String(image.id)))); return }
    const response = await fetch(`/api/media/${image.id}/delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deleteOriginal: true }) })
    const data = await response.json()
    if (!response.ok) { setError(data.error || 'Could not remove image.'); return }
    setImages((current) => current.filter((item) => item.id !== image.id))
  }

  function moveImage(index: number, offset: number) {
    setImages((current) => { const target = index + offset; if (target < 0 || target >= current.length) return current; const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next })
  }

  async function discardDraft() {
    if (!window.confirm('Discard this draft form and delete its uploaded images?')) return
    await Promise.all(images.filter((image) => !image.existing).map((image) => removeImage(image)))
    cancelEditing()
  }

  async function duplicateProduct(id: string | number) {
    setError(''); setNotice('')
    requestID.current = ''
    const response = await fetch(`/api/studio/products/${id}/duplicate-data`)
    const data = await response.json()
    if (!response.ok) { setError(data.error || 'Could not load product to duplicate.'); return }
    setEditingId(null); setEditingUpdatedAt(''); setEditingStatus('draft')
    setTitle(''); setCategory(data.category); setPrice(data.price === '' ? '' : String(data.price)); setSupplierSKU(''); setPurchaseURL(''); setCombinations(data.combinations); setSizes(data.sizes); setPriceOverrides(data.priceOverrides || {}); setImageOverrides({}); setStockOverrides({}); setVariantSupplierSKUs({}); setVariantPurchaseURLs({}); setVariantEnabled({})
    setImages([]); setDescriptionMode('auto'); setSeoTitleMode('auto'); setSeoDescriptionMode('auto'); setDescription(''); setSeoTitle(''); setSeoDescription('')
    document.getElementById('quick-add')?.scrollIntoView({ behavior: 'smooth' })
    setNotice('Product details copied. Add a new name and images; inventory starts at 10.')
  }

  async function editProduct(id: string | number) {
    setError(''); setNotice('')
    const response = await fetch(`/api/studio/products/${id}`)
    const data = await response.json()
    if (!response.ok) { setError(data.error || 'Could not load product.'); return }
    const prices: Record<string, number> = {}; const imagesByVariant: Record<string, string> = {}; const stocks: Record<string, number> = {}; const supplierSKUs: Record<string, string> = {}; const purchaseURLs: Record<string, string> = {}; const enabled: Record<string, boolean> = {}
    for (const variant of data.variants) {
      if (variant.price !== '') prices[variant.key] = Number(variant.price)
      if (variant.image) imagesByVariant[variant.key] = String(variant.image)
      stocks[variant.key] = Number(variant.stock)
      if (variant.supplierSKU) supplierSKUs[variant.key] = variant.supplierSKU
      if (variant.purchaseURL) purchaseURLs[variant.key] = variant.purchaseURL
      if (variant.enabled) enabled[variant.key] = true
    }
    setEditingId(id); setEditingUpdatedAt(data.updatedAt); setEditingStatus(data.status)
    setTitle(data.title || ''); setCategory(data.category); setPrice(data.price === '' ? '' : String(data.price))
    setSupplierSKU(data.supplierSKU); setPurchaseURL(data.purchaseURL); setDescriptionMode(data.descriptionMode); setDescription(data.description); setSeoTitleMode(data.seoTitleMode); setSeoTitle(data.seoTitle); setSeoDescriptionMode(data.seoDescriptionMode); setSeoDescription(data.seoDescription)
    setImages(data.media); setCombinations(data.combinations); setSizes(data.sizes); setPriceOverrides(prices); setImageOverrides(imagesByVariant); setStockOverrides(stocks); setVariantSupplierSKUs(supplierSKUs); setVariantPurchaseURLs(purchaseURLs); setVariantEnabled(enabled)
    document.getElementById('quick-add')?.scrollIntoView({ behavior: 'smooth' })
    setNotice(`Editing ${data.title}. Existing variants and inventory will be preserved unless changed.${data.unavailableMediaCount ? ` ${data.unavailableMediaCount} missing or legacy image reference(s) were excluded; saving will unlink them from this product.` : ''}`)
  }

  async function bulkUpdate() {
    setError(''); setNotice('')
    const items = Object.values(selectedProducts).map(({ id, updatedAt }) => ({ id, updatedAt }))
    try {
      const response = await fetch('/api/studio/products/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items, ...(bulkPrice === '' ? {} : { price: bulkPrice }), ...(bulkStock === '' ? {} : { stock: bulkStock }), ...(bulkStatus ? { status: bulkStatus } : {}) }) })
      const data = await responseData(response)
      setNotice(`Updated ${data.updated} product(s).${data.failed?.length ? ` Skipped ${data.failed.length}: ${data.failed.map((item: any) => `${item.title}: ${item.error}`).join(' · ')}` : ''}`)
      setBulkPrice(''); setBulkStock(''); setBulkStatus('')
      setSelectedIDs([])
      setSelectedProducts({})
      const params = new URLSearchParams({ page: String(page), status, sort })
      if (search.trim()) params.set('search', search.trim())
      const refresh = await fetch(`/api/studio/products?${params}`, { cache: 'no-store' }); const result = await responseData(refresh)
      setProducts(result.docs)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Bulk update failed.') }
  }

  useEffect(() => {
    if (!libraryOpen) return
    const params = new URLSearchParams({ page: String(libraryPage) })
    if (librarySearch.trim()) params.set('search', librarySearch.trim())
    fetch(`/api/studio/media?${params}`, { cache: 'no-store' }).then(responseData).then((data) => {
      setLibraryImages(data.docs.map((image: any) => ({ id: image.id, url: image.url, name: image.filename || image.title || 'Product image', existing: true })))
      setLibraryTotalPages(data.totalPages || 1)
    }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not load images.'))
  }, [libraryOpen, libraryPage, librarySearch])

  function cancelEditing() {
    requestID.current = ''
    setEditingId(null); setEditingUpdatedAt(''); setEditingStatus('draft'); setTitle(''); setSupplierSKU(''); setPurchaseURL(''); setPrice(''); setImages([]); setCombinations([]); setSizes(['xs', 's', 'm', 'l']); setPriceOverrides({}); setImageOverrides({}); setStockOverrides({}); setVariantSupplierSKUs({}); setVariantPurchaseURLs({}); setVariantEnabled({}); setDescription(''); setSeoTitle(''); setSeoDescription(''); setDescriptionMode('auto'); setSeoTitleMode('auto'); setSeoDescriptionMode('auto')
  }

  return (
    <main className="product-studio min-h-screen bg-[#f7f3f0] font-sans text-base antialiased text-[#302522]">
      <div className="mx-auto min-h-screen max-w-[1600px]">
        <div className="min-w-0 px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
          <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#a17e74]">Catalog workspace</p>
              <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Product Studio</h1>
              <p className="mt-2 text-sm text-[#887974]">Manage your product drafts and catalog.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-[#e7ddd8] bg-white px-3 py-2 text-xs text-[#806e68]">{totalDocs} products</span>
            </div>
          </header>

          {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
          {notice && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

          <div className="grid items-start gap-7">
            <section id="products" className="overflow-hidden rounded-2xl border border-[#eee5e0] bg-white shadow-[0_8px_30px_rgba(74,50,42,0.035)]">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f0e9e5] px-5 py-5 sm:px-7">
                <div>
                  <h2 className="font-serif text-xl">Products</h2>
                  <p className="mt-1 text-xs text-[#968680]">Search and manage your catalog</p>
                </div>
                <a href="#quick-add" className="rounded-xl bg-[#8b5d53] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#754a41]">＋ Add product</a>
              </div>
              <div className="flex flex-col gap-3 border-b border-[#f0e9e5] px-5 py-4 sm:flex-row sm:px-7">
                <input aria-label="Search products" className={`${inputClass} sm:max-w-sm`} placeholder="Search name or SKU" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); setSelectedIDs([]); setSelectedProducts({}) }} />
                <select aria-label="Filter by status" className={`${inputClass} sm:w-44`} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); setSelectedIDs([]); setSelectedProducts({}) }}>
                  <option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option>
                </select>
                <select aria-label="Sort products" className={`${inputClass} sm:w-48`} value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); setSelectedIDs([]); setSelectedProducts({}) }}>
                  <option value="-updatedAt">Recently updated</option><option value="updatedAt">Least recently updated</option><option value="-createdAt">Recently created</option><option value="createdAt">Oldest created</option><option value="title">Name A–Z</option><option value="-title">Name Z–A</option><option value="price">Price low to high</option><option value="-price">Price high to low</option>
                </select>
              </div>
              {selectedIDs.length > 0 && <div className="flex flex-wrap items-end gap-3 border-b border-[#f0e9e5] bg-[#fcfaf9] px-5 py-4 sm:px-7"><p className="mr-auto self-center text-xs">{selectedIDs.length} selected</p><label className="text-xs text-[#766762]">Set base price<input aria-label="Bulk base price" className="mt-1 block w-28 rounded-lg border border-[#e7ddd8] bg-white px-2 py-2" type="number" min="0" step="0.01" value={bulkPrice} onChange={(event) => setBulkPrice(event.target.value)} placeholder="No change" /></label><label className="text-xs text-[#766762]">Set enabled variant stock<input aria-label="Bulk variant stock" className="mt-1 block w-28 rounded-lg border border-[#e7ddd8] bg-white px-2 py-2" type="number" min="0" step="1" value={bulkStock} onChange={(event) => setBulkStock(event.target.value)} placeholder="No change" /></label><label className="text-xs text-[#766762]">Set status<select aria-label="Bulk product status" className="mt-1 block w-32 rounded-lg border border-[#e7ddd8] bg-white px-2 py-2" value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value)}><option value="">No change</option><option value="draft">Draft</option><option value="published">Published</option></select></label><button type="button" onClick={() => void bulkUpdate()} className="rounded-lg bg-[#8b5d53] px-3 py-2 text-xs font-medium text-white">Apply</button></div>}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] text-left text-sm">
                  <thead className="bg-[#fcfaf9] text-[11px] uppercase tracking-[0.14em] text-[#9a8882]"><tr><th className="px-4 py-3"><input aria-label="Select all products on this page" type="checkbox" checked={products.length > 0 && products.every((product) => selectedIDs.includes(String(product.id)))} onChange={(event) => { const pageIDs = products.map((product) => String(product.id)); setSelectedIDs((current) => event.target.checked ? [...new Set([...current, ...pageIDs])] : current.filter((id) => !pageIDs.includes(id))); setSelectedProducts((current) => event.target.checked ? { ...current, ...Object.fromEntries(products.map((product) => [String(product.id), product])) } : Object.fromEntries(Object.entries(current).filter(([id]) => !pageIDs.includes(id)))) }} /></th><th className="px-6 py-3 font-medium">Product</th><th className="px-4 py-3 font-medium">SKU</th><th className="px-4 py-3 font-medium">Price</th><th className="px-4 py-3 font-medium">Variants</th><th className="px-4 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium">Updated</th><th className="px-3 py-3 font-medium">Action</th></tr></thead>
                  <tbody className="divide-y divide-[#f3eeeb]">
                    {loading ? <tr><td className="px-6 py-12 text-center text-[#968680]" colSpan={8}>Loading products…</td></tr>
                      : products.length === 0 ? <tr><td className="px-6 py-14 text-center" colSpan={8}><p className="font-medium">No products found</p><p className="mt-1 text-xs text-[#968680]">Create a draft to get started.</p></td></tr>
                        : products.map((product) => <tr key={product.id} className="hover:bg-[#fdfbfa]">
                          <td className="px-4 py-4"><input aria-label={`Select ${product.title}`} type="checkbox" checked={selectedIDs.includes(String(product.id))} onChange={(event) => { const id = String(product.id); setSelectedIDs((current) => event.target.checked ? [...new Set([...current, id])] : current.filter((item) => item !== id)); setSelectedProducts((current) => { const next = { ...current }; if (event.target.checked) next[id] = product; else delete next[id]; return next }) }} /></td><td className="px-6 py-4"><a className="flex items-center gap-3 font-medium hover:text-[#8b5d53]" href={`/admin/collections/products/${product.id}/`}>
                            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f7f1ee] text-[#b99d94]">{product.image ? <Image src={product.image} alt="" fill sizes="44px" unoptimized className="object-cover" /> : '✳'}</span>
                            <span className="max-w-[240px] truncate">{product.title || 'Untitled product'}</span>
                          </a></td>
                          <td className="px-4 py-4 text-xs text-[#897a75]">{product.sku || '—'}</td>
                          <td className="px-4 py-4">{product.price == null ? '—' : `$${Number(product.price).toFixed(2)}`}</td>
                          <td className="px-4 py-4 text-[#766762]">{product.variantCount}</td>
                          <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${product.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-[#f5efec] text-[#8b5d53]'}`}>{product.status === 'published' ? 'Published' : 'Draft'}</span></td>
                          <td className="px-6 py-4 text-xs text-[#897a75]">{new Date(product.updatedAt).toLocaleDateString()}</td><td className="px-3 py-4"><div className="flex gap-2"><button type="button" onClick={() => void editProduct(product.id)} className="appearance-none border-0 bg-transparent px-0 py-0 text-sm font-medium text-[#8b5d53] hover:underline" style={{ backgroundColor: 'transparent', color: '#8b5d53' }}>Edit</button><button type="button" onClick={() => void duplicateProduct(product.id)} className="appearance-none border-0 bg-transparent px-0 py-0 text-sm font-medium text-[#8b5d53] hover:underline" style={{ backgroundColor: 'transparent', color: '#8b5d53' }}>Duplicate</button></div></td>
                        </tr>)}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-[#f0e9e5] px-6 py-4 text-xs text-[#897a75]">
                <span>Page {page} of {totalPages}</span>
                <div className="flex gap-2"><button type="button" className="rounded-lg border border-[#e7ddd8] px-3 py-2 disabled:opacity-40" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>Previous</button><button type="button" className="rounded-lg border border-[#e7ddd8] px-3 py-2 disabled:opacity-40" disabled={page >= totalPages || loading} onClick={() => setPage(page + 1)}>Next</button></div>
              </div>
            </section>

            <section id="quick-add" className="rounded-2xl border border-[#eee5e0] bg-white p-5 shadow-[0_8px_30px_rgba(74,50,42,0.035)] sm:p-6">
              <div className="mb-6 flex items-start justify-between gap-3">
                <div><p className="text-[10px] uppercase tracking-[0.2em] text-[#a17e74]">{editingId ? 'Edit product' : 'Quick Add'}</p><h2 className="mt-1 font-serif text-2xl">{editingId ? 'Update product' : 'New product'}</h2><p className="mt-1 text-xs text-[#968680]">{editingId ? `Editing ${editingStatus} product · inventory is checked for conflicts` : 'Start with the basics. You can finish the draft later.'}</p></div>
                <span className="rounded-full bg-[#f5efec] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#8b5d53]">{editingId ? editingStatus : 'Draft'}</span>
              </div>
              <form onSubmit={(event) => { event.preventDefault(); void saveDraft(false) }} className="space-y-5">
                <div><FieldLabel>Product name <span className="text-[#b45749]">*</span></FieldLabel><input className={inputClass} required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Rosewater" /></div>
                <div className="grid grid-cols-[1fr_130px] gap-3">
                  <div><FieldLabel>Category</FieldLabel><select className={inputClass} value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                  <div><FieldLabel>Base price</FieldLabel><div className="relative"><span className="absolute left-3 top-3 text-sm text-[#9a8882]">$</span><input className={`${inputClass} pl-7`} type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Optional" /></div></div>
                </div>

                <details open className="rounded-xl border border-[#eee5e0] px-4 py-3">
                  <summary className="cursor-pointer text-sm font-medium">Supplier information <span className="text-xs font-normal text-[#968680]">(admin only)</span></summary>
                  <div className="mt-3 space-y-3"><div><FieldLabel>Supplier SKU</FieldLabel><input className={inputClass} value={supplierSKU} onChange={(event) => setSupplierSKU(event.target.value)} placeholder="Internal supplier reference" /></div><div><FieldLabel>Purchase URL</FieldLabel><input className={inputClass} type="url" value={purchaseURL} onChange={(event) => setPurchaseURL(event.target.value)} placeholder="https://supplier.example/item" /></div><p className="text-[11px] text-[#968680]">Not shown on the storefront, feeds, or customer order data.</p></div>
                </details>

                <div className="border-t border-[#f0e9e5] pt-5">
                  <FieldLabel>Product images <span className="text-xs font-normal text-[#968680]">{images.length} uploaded · first image is featured</span></FieldLabel>
                  <button type="button" onClick={() => { setLibrarySelected([]); setLibraryOpen(true) }} className="mb-3 rounded-lg border border-[#e7ddd8] px-3 py-2 text-xs font-medium text-[#8b5d53]">Choose existing images</button>
                  <div onDragEnter={(event) => { event.preventDefault(); if (!uploading) setImageDropActive(true) }} onDragOver={(event) => { event.preventDefault() }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setImageDropActive(false) }} onDrop={(event) => { event.preventDefault(); setImageDropActive(false); if (!uploading) void uploadImages(event.dataTransfer.files) }} className={`rounded-xl border border-dashed p-4 transition ${imageDropActive ? 'border-[#8b5d53] bg-[#f5efec]' : 'border-[#d9c9c2] bg-[#fcfaf9]'} ${uploading ? 'opacity-60' : ''}`}>
                    <p className="mb-2 text-xs text-[#766762]">Drag and drop images here, or choose files</p>
                    <input aria-label="Upload product images" type="file" accept="image/heic,image/heif,image/jpeg,image/png,image/webp,.heic,.heif" multiple disabled={uploading} onChange={(event) => { void uploadImages(event.target.files); event.currentTarget.value = '' }} className="block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-[#f5efec] file:px-3 file:py-2 file:text-xs file:font-medium file:text-[#8b5d53]" />
                  </div>
                  {uploading && <p className="mt-2 text-xs text-[#887974]">Uploading and converting images…</p>}
                  <div className="mt-3 grid grid-cols-4 gap-2">{images.map((image, index) => <div key={image.id} className="relative aspect-square overflow-hidden rounded-lg bg-[#f7f1ee]"><Image src={image.url} alt={image.name} fill unoptimized sizes="80px" className="object-cover" /><span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">{index === 0 ? 'Featured' : index + 1}</span><div className="absolute right-1 top-1 flex gap-1"><button type="button" aria-label="Move image earlier" disabled={index === 0} onClick={() => moveImage(index, -1)} className="rounded bg-white/90 px-1.5 text-xs disabled:opacity-40">←</button><button type="button" aria-label="Move image later" disabled={index === images.length - 1} onClick={() => moveImage(index, 1)} className="rounded bg-white/90 px-1.5 text-xs disabled:opacity-40">→</button><button type="button" aria-label={`Remove ${image.name}`} onClick={() => void removeImage(image)} className="rounded bg-white/90 px-1.5 text-xs text-red-700">×</button></div></div>)}</div>
                </div>

                <div className="border-t border-[#f0e9e5] pt-5">
                  <FieldLabel>Length & Shape combinations</FieldLabel>
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <select aria-label="Length" className={inputClass} value={length} onChange={(event) => setLength(event.target.value)}>{[['x-short','X-Short'],['short','Short'],['medium','Medium'],['long','Long'],['x-long','X-Long']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select>
                    <select aria-label="Shape" className={inputClass} value={shape} onChange={(event) => setShape(event.target.value)}>{[['square','Square'],['oval','Oval'],['almond','Almond'],['round','Round']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select>
                    <button type="button" onClick={() => setCombinations((current) => current.some((item) => item.length === length && item.shape === shape) ? current : [...current, { length, shape }])} className="rounded-xl border border-[#e7ddd8] px-3 text-xs">Add</button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">{combinations.map((item) => <button type="button" key={`${item.length}-${item.shape}`} onClick={() => setCombinations((current) => current.filter((entry) => entry !== item))} className="rounded-full bg-[#f5efec] px-3 py-1.5 text-xs">{item.length} / {item.shape} ×</button>)}</div>
                  <div className="mt-3 flex gap-4 text-xs">{[['xs','XS'],['s','S'],['m','M'],['l','L']].map(([value,label]) => <label key={value} className="flex items-center gap-1.5"><input type="checkbox" checked={sizes.includes(value)} onChange={(event) => setSizes((current) => event.target.checked ? [...current, value] : current.filter((item) => item !== value))} />{label}</label>)}</div>
                  {combinations.length > 0 && sizes.length > 0 && <div className="mt-3 space-y-2">{combinations.flatMap((combo) => sizes.map((size) => {
                    const key = `${combo.length}|${combo.shape}|${size}`
                    return <div key={key}><div className="grid grid-cols-[1fr_72px_90px] gap-2"><label className="flex items-center justify-between gap-2 text-xs text-[#766762]"><span className="min-w-0 truncate">{combo.length}/{combo.shape} · {size.toUpperCase()} $</span><input aria-label={`${combo.length} ${combo.shape} ${size} variant price`} className="w-20 rounded-lg border border-[#e7ddd8] px-2 py-1.5 text-right" type="number" min="0" step="0.01" placeholder="Inherit" value={priceOverrides[key] ?? ''} onChange={(event) => setPriceOverrides((current) => { const next = { ...current }; if (event.target.value === '') delete next[key]; else next[key] = Number(event.target.value); return next })} /></label><input aria-label={`${combo.length} ${combo.shape} ${size} variant stock`} className="w-[72px] rounded-lg border border-[#e7ddd8] px-2 py-1.5 text-right text-xs" type="number" min="0" step="1" value={stockOverrides[key] ?? 10} onChange={(event) => setStockOverrides((current) => ({ ...current, [key]: Number(event.target.value) }))} /><select aria-label={`${combo.length} ${combo.shape} ${size} variant image`} className="rounded-lg border border-[#e7ddd8] px-1.5 py-1 text-[10px]" value={imageOverrides[key] || ''} onChange={(event) => setImageOverrides((current) => ({ ...current, [key]: event.target.value }))}><option value="">Product image</option>{images.map((image, index) => <option key={image.id} value={String(image.id)}>Image {index + 1}</option>)}</select></div><label className="ml-2 mt-1 flex items-center gap-1.5 text-[10px] text-[#968680]"><input type="checkbox" checked={variantEnabled[key] !== false} onChange={(event) => setVariantEnabled((current) => ({ ...current, [key]: event.target.checked }))} />Enabled</label><details className="ml-2 mt-1"><summary className="cursor-pointer text-[10px] text-[#968680]">Variant supplier info</summary><div className="mt-2 grid grid-cols-2 gap-2"><input aria-label="Variant supplier SKU" className="rounded-lg border border-[#e7ddd8] px-2 py-1.5 text-xs" placeholder="Supplier SKU" value={variantSupplierSKUs[key] || ''} onChange={(event) => setVariantSupplierSKUs((current) => ({ ...current, [key]: event.target.value }))} /><input aria-label="Variant purchase URL" className="rounded-lg border border-[#e7ddd8] px-2 py-1.5 text-xs" type="url" placeholder="Purchase URL" value={variantPurchaseURLs[key] || ''} onChange={(event) => setVariantPurchaseURLs((current) => ({ ...current, [key]: event.target.value }))} /></div></details></div>
                  }))}</div>}
                  <p className="mt-2 text-[11px] text-[#968680]">{combinations.length * sizes.length} variants · stock defaults to 10 · price and image inherit from the product</p>
                </div>

                <div className="border-t border-[#f0e9e5] pt-5">
                  <div className="mb-3 flex items-center justify-between"><FieldLabel>Description</FieldLabel><div className="flex rounded-lg bg-[#f7f3f0] p-1 text-[11px]"><button type="button" onClick={() => setDescriptionMode('auto')} className={`rounded-md px-3 py-1.5 ${descriptionMode === 'auto' ? 'bg-white font-medium text-[#8b5d53] shadow-sm' : 'text-[#887974]'}`}>Auto</button><button type="button" onClick={() => { if (descriptionMode === 'auto') setDescription(autoDescription); setDescriptionMode('custom') }} className={`rounded-md px-3 py-1.5 ${descriptionMode === 'custom' ? 'bg-white font-medium text-[#8b5d53] shadow-sm' : 'text-[#887974]'}`}>Custom</button></div></div>
                  {descriptionMode === 'custom' ? <><textarea className={`${inputClass} min-h-28 resize-y`} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Write a custom description (Markdown supported)" /><div className="mt-3 rounded-xl bg-[#fcfaf9] p-4 text-xs leading-5 text-[#786963]"><p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#968680]">Markdown preview</p><div className="product-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown></div></div></> : <div className="rounded-xl bg-[#fcfaf9] p-4 text-xs leading-5 text-[#786963]"><div className="product-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{autoDescription}</ReactMarkdown></div></div>}
                </div>

                <div className="border-t border-[#f0e9e5] pt-5">
                  <p className="mb-4 text-sm font-medium">SEO</p>
                  <div className="mb-2 flex items-center justify-between"><FieldLabel>SEO title</FieldLabel><div className="flex rounded-lg bg-[#f7f3f0] p-1 text-[11px]"><button type="button" onClick={() => setSeoTitleMode('auto')} className={`rounded-md px-2.5 py-1 ${seoTitleMode === 'auto' ? 'bg-white font-medium text-[#8b5d53] shadow-sm' : 'text-[#887974]'}`}>Auto</button><button type="button" onClick={() => { if (seoTitleMode === 'auto') setSeoTitle(autoSeoTitle); setSeoTitleMode('custom') }} className={`rounded-md px-2.5 py-1 ${seoTitleMode === 'custom' ? 'bg-white font-medium text-[#8b5d53] shadow-sm' : 'text-[#887974]'}`}>Custom</button></div></div>
                  {seoTitleMode === 'custom' ? <input className={inputClass} value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} placeholder="Search title" /> : <p className="min-h-10 rounded-xl bg-[#fcfaf9] px-4 py-3 text-xs leading-4 text-[#786963]">{autoSeoTitle || 'Generated from the product name'}</p>}
                  <div className="mb-2 mt-4 flex items-center justify-between"><FieldLabel>SEO description</FieldLabel><div className="flex rounded-lg bg-[#f7f3f0] p-1 text-[11px]"><button type="button" onClick={() => setSeoDescriptionMode('auto')} className={`rounded-md px-2.5 py-1 ${seoDescriptionMode === 'auto' ? 'bg-white font-medium text-[#8b5d53] shadow-sm' : 'text-[#887974]'}`}>Auto</button><button type="button" onClick={() => { if (seoDescriptionMode === 'auto') setSeoDescription(autoSeoDescription); setSeoDescriptionMode('custom') }} className={`rounded-md px-2.5 py-1 ${seoDescriptionMode === 'custom' ? 'bg-white font-medium text-[#8b5d53] shadow-sm' : 'text-[#887974]'}`}>Custom</button></div></div>
                  {seoDescriptionMode === 'custom' ? <textarea className={`${inputClass} min-h-20 resize-y`} value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} placeholder="Search description" /> : <p className="min-h-10 rounded-xl bg-[#fcfaf9] px-4 py-3 text-xs leading-4 text-[#786963]">{autoSeoDescription || 'Generated from the product name'}</p>}
                </div>

                <div className="space-y-2 border-t border-[#f0e9e5] pt-5">
                  <button type="submit" disabled={saving || !title.trim()} className="w-full rounded-xl bg-[#8b5d53] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#754a41] disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Saving…' : editingId ? 'Save Changes' : 'Save Draft'}</button>
                  <button type="button" disabled={saving || !title.trim()} onClick={() => void saveDraft(false, 'publish')} className="w-full rounded-xl border border-[#8b5d53] px-4 py-3 text-sm font-medium text-[#8b5d53] disabled:opacity-50">{editingId && editingStatus === 'published' ? 'Save & Keep Published' : 'Publish'}</button>
                  {!editingId && <button type="button" disabled={saving || !title.trim()} onClick={() => void saveDraft(true)} className="w-full rounded-xl border border-[#e7ddd8] bg-white px-4 py-3 text-sm font-medium text-[#735d56] transition hover:bg-[#fcfaf9] disabled:cursor-not-allowed disabled:opacity-50">Save & Add Another</button>}
                  {editingId && <button type="button" disabled={saving} onClick={() => void discardDraft()} className="w-full rounded-xl border border-[#e7ddd8] px-4 py-3 text-sm">Cancel editing</button>}
                  <button type="button" disabled={saving || uploading} onClick={() => void discardDraft()} className="w-full px-4 py-2 text-xs text-[#9a7770]">Discard draft and uploaded images</button>
                  <p className="text-center text-[11px] leading-4 text-[#9a8882]">Drafts are private and won’t appear in the storefront or product feeds.</p>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
      {libraryOpen && <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setLibraryOpen(false) }}><section role="dialog" aria-modal="true" aria-labelledby="media-library-title" className="max-h-[85vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white p-5 shadow-xl"><div className="flex items-center justify-between"><h2 id="media-library-title" className="font-serif text-2xl">Media library</h2><button type="button" onClick={() => setLibraryOpen(false)} aria-label="Close media library">×</button></div><input className={`${inputClass} my-4`} aria-label="Search media library" placeholder="Search uploaded images" value={librarySearch} onChange={(event) => { setLibrarySearch(event.target.value); setLibraryPage(1) }} /><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{libraryImages.map((image) => <button type="button" key={image.id} aria-pressed={librarySelected.includes(String(image.id))} onClick={() => setLibrarySelected((current) => current.includes(String(image.id)) ? current.filter((id) => id !== String(image.id)) : [...current, String(image.id)])} className={`overflow-hidden rounded-xl border text-left ${librarySelected.includes(String(image.id)) ? 'border-[#8b5d53] ring-2 ring-[#8b5d53]/20' : 'border-[#e7ddd8]'}`}><span className="relative block aspect-square"><Image src={image.url} alt={image.name} fill unoptimized sizes="25vw" className="object-cover" /></span><span className="block truncate px-2 py-2 text-xs">{image.name}</span></button>)}</div><div className="mt-4 flex items-center justify-between gap-3"><button type="button" disabled={libraryPage <= 1} onClick={() => setLibraryPage((page) => page - 1)} className="rounded border px-3 py-2 text-sm disabled:opacity-40">Previous</button><span className="text-xs">Page {libraryPage} of {libraryTotalPages}</span><button type="button" disabled={libraryPage >= libraryTotalPages} onClick={() => setLibraryPage((page) => page + 1)} className="rounded border px-3 py-2 text-sm disabled:opacity-40">Next</button><button type="button" onClick={() => { setImages((current) => [...current, ...libraryImages.filter((image) => librarySelected.includes(String(image.id)) && !current.some((entry) => String(entry.id) === String(image.id)))]); setLibraryOpen(false) }} className="rounded-lg bg-[#8b5d53] px-4 py-2 text-sm text-white">Add selected ({librarySelected.length})</button></div></section></div>}
    </main>
  )
}
