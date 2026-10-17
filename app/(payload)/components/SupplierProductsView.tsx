'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type SupplierProduct = { id: string; title: string; chineseName: string; purchaseURL: string; status: 'draft' | 'published'; assigned: boolean }

export function SupplierProductsView({ docID }: { docID?: string | number }) {
  const pathname = usePathname()
  const routeID = pathname.match(/\/collections\/suppliers\/([^/]+)\/manage-products\/?$/)?.[1]
  const supplierID = docID ? String(docID) : routeID ? decodeURIComponent(routeID) : ''
  const [supplierName, setSupplierName] = useState('Supplier')
  const [products, setProducts] = useState<SupplierProduct[]>([])
  const [query, setQuery] = useState('')
  const [showAssigned, setShowAssigned] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDocs, setTotalDocs] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<'draft' | 'published'>('draft')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async (signal: AbortSignal) => {
    if (!supplierID) return
    try {
      const params = new URLSearchParams({ page: String(page), assigned: String(showAssigned) })
      if (query.trim()) params.set('search', query.trim())
      const response = await fetch(`/api/studio/suppliers/${encodeURIComponent(supplierID)}/products?${params}`, { credentials: 'same-origin', cache: 'no-store', signal })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not load products.')
      setError('')
      setSupplierName(result.supplier?.name || 'Supplier')
      setProducts(result.docs || [])
      setTotalPages(result.totalPages || 1)
      setTotalDocs(result.totalDocs || 0)
    } catch (cause) {
      if (!signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not load products.')
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }, [page, query, showAssigned, supplierID])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  const allVisibleSelected = products.length > 0 && products.every((product) => selected.includes(product.id))
  const toggleOne = (id: string, checked: boolean) => setSelected((current) => checked ? [...new Set([...current, id])] : current.filter((item) => item !== id))
  const toggleVisible = () => setSelected((current) => allVisibleSelected ? current.filter((id) => !products.some((product) => product.id === id)) : [...new Set([...current, ...products.map((product) => product.id)])])

  const updateSelected = async (action: 'bind' | 'unbind' | 'status') => {
    if (!selected.length || selected.length > 100) {
      setError('Select between 1 and 100 products per operation.')
      return
    }
    const operation = action === 'status'
      ? `change ${selected.length} selected product(s) to ${selectedStatus === 'published' ? 'Published' : 'Draft'}`
      : `${action === 'bind' ? 'add this supplier to' : 'remove this supplier from'} ${selected.length} selected product(s)`
    if (!window.confirm(`Are you sure you want to ${operation}?`)) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch(`/api/studio/suppliers/${encodeURIComponent(supplierID)}/products`, {
        method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, productIDs: selected, ...(action === 'status' ? { status: selectedStatus } : {}) }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not update products.')
      const updatedIDs = new Set<string>(result.updated || [])
      if (action === 'status') {
        setProducts((current) => current.map((product) => updatedIDs.has(product.id) ? { ...product, status: selectedStatus } : product))
      } else {
        setProducts((current) => current.filter((product) => !updatedIDs.has(product.id)))
        setTotalDocs((current) => Math.max(0, current - updatedIDs.size))
      }
      setSelected([])
      setNotice(`${updatedIDs.size} product(s) updated.${result.failed?.length ? ` ${result.failed.length} failed.` : ''}`)
      if (result.failed?.length) setError(result.failed.map((item: { title: string; error: string }) => `${item.title}: ${item.error}`).join(' · '))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update products.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="mx-auto w-full max-w-6xl p-6 text-[#302522]">
    <Link href="/admin/collections/suppliers" className="text-sm text-[#8b5d53] underline">← Suppliers</Link>
    <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-sm uppercase tracking-[0.16em] text-[#a17e74]">Supplier</p><h1 className="mt-1 font-serif text-3xl">Manage Products · {supplierName}</h1><p className="mt-1 text-sm text-[#766762]">Manage product-level Supplier links. Variant-level links remain managed in Product Studio.</p></div>
      <input aria-label="Search products" type="search" value={query} onChange={(event) => { setLoading(true); setQuery(event.target.value); setPage(1); setSelected([]) }} placeholder="Search name or Chinese name" className="w-full max-w-sm rounded-lg border border-[#e7ddd8] bg-white px-3 py-2 text-sm" />
    </div>
    <div className="mt-4 flex gap-2" role="group" aria-label="Filter products by supplier link">
      <button type="button" aria-pressed={showAssigned} onClick={() => { setLoading(true); setShowAssigned(true); setPage(1); setSelected([]) }} className={`rounded-lg px-3 py-2 text-sm ${showAssigned ? 'bg-[#8b5d53] text-white' : 'border border-[#e7ddd8] bg-white text-[#684b44]'}`}>Linked</button>
      <button type="button" aria-pressed={!showAssigned} onClick={() => { setLoading(true); setShowAssigned(false); setPage(1); setSelected([]) }} className={`rounded-lg px-3 py-2 text-sm ${!showAssigned ? 'bg-[#8b5d53] text-white' : 'border border-[#e7ddd8] bg-white text-[#684b44]'}`}>Not linked</button>
    </div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e7ddd8] bg-white p-3">
      <span className="text-sm text-[#766762]">{selected.length ? `${selected.length} selected` : 'Select products to manage this supplier relationship.'}</span>
      <div className="flex flex-wrap gap-2">
        {showAssigned ? <><label className="flex items-center gap-2 text-sm text-[#684b44]">Set status<select aria-label="Set selected products status" value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as 'draft' | 'published')} disabled={busy || !selected.length} className="rounded-lg border border-[#d9c9c2] bg-white px-2.5 py-2 font-medium disabled:opacity-50"><option value="draft">Draft</option><option value="published">Published</option></select></label><button type="button" disabled={busy || !selected.length} onClick={() => void updateSelected('status')} className="rounded-lg bg-[#8b5d53] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#73483f] disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Updating…' : 'Update status'}</button><button type="button" disabled={busy || !selected.length} onClick={() => void updateSelected('unbind')} className="rounded-lg border-2 border-[#a5483d] bg-[#fff8f6] px-3 py-2 text-sm font-semibold text-[#8f3027] hover:bg-[#fae8e4] disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Updating…' : 'Remove from selected'}</button></> : <button type="button" disabled={busy || !selected.length} onClick={() => void updateSelected('bind')} className="rounded-lg bg-[#8b5d53] px-3 py-2 text-sm font-medium text-white disabled:opacity-50">{busy ? 'Updating…' : 'Add supplier to selected'}</button>}
      </div>
    </div>
    {notice && <p role="status" className="mt-3 text-sm text-green-800">{notice}</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    <div className="mt-4 overflow-x-auto rounded-xl border border-[#e7ddd8] bg-white">
      <table className="w-full border-collapse text-left text-sm">
        <thead><tr className="border-b border-[#eee5e0] text-[#766762]"><th className="w-12 p-3"><input aria-label="Select visible products" type="checkbox" checked={allVisibleSelected} onChange={toggleVisible} /></th><th className="p-3">Product</th><th className="p-3">Chinese Name</th><th className="p-3">Product Purchase URL</th><th className="p-3">Status</th></tr></thead>
        <tbody>{loading ? <tr><td colSpan={5} className="p-5 text-center text-[#766762]">Loading products…</td></tr> : products.length ? products.map((product) => <tr key={product.id} className="border-b border-[#f1eae6] last:border-0"><td className="p-3"><input aria-label={`Select ${product.title}`} type="checkbox" checked={selected.includes(product.id)} onChange={(event) => toggleOne(product.id, event.target.checked)} /></td><td className="p-3 font-medium">{product.title || 'Untitled product'}</td><td className="p-3">{product.chineseName || '—'}</td><td className="max-w-xs truncate p-3">{/^https?:\/\//i.test(product.purchaseURL) ? <a href={product.purchaseURL} target="_blank" rel="noopener noreferrer" className="text-[#8b5d53] underline">{product.purchaseURL}</a> : '—'}</td><td className="p-3 capitalize">{product.status}</td></tr>) : <tr><td colSpan={5} className="p-5 text-center text-[#766762]">No products found.</td></tr>}</tbody>
      </table>
    </div>
    <div className="mt-3 flex items-center justify-between text-sm text-[#766762]"><span>{totalDocs} products · Page {page} of {totalPages}</span><div className="flex gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => { setLoading(true); setPage((current) => current - 1) }} className="rounded-lg border border-[#e7ddd8] px-3 py-1.5 disabled:opacity-50">Previous</button><button type="button" disabled={page >= totalPages || loading} onClick={() => { setLoading(true); setPage((current) => current + 1) }} className="rounded-lg border border-[#e7ddd8] px-3 py-1.5 disabled:opacity-50">Next</button></div></div>
  </main>
}
