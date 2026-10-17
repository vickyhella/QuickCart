'use client'

import Link from 'next/link'
import { useState } from 'react'

export function SupplierNameCell({ cellData }: { cellData?: unknown }) {
  return <>{typeof cellData === 'string' && cellData ? cellData : '—'}</>
}

export function SupplierActionCell({ rowData }: { rowData?: { id?: string | number; name?: string } }) {
  const [busy, setBusy] = useState(false)
  if (!rowData?.id) return null
  const id = String(rowData.id)

  async function remove() {
    if (!window.confirm(`Permanently delete supplier “${rowData?.name || id}”?`)) return
    setBusy(true)
    try {
      const response = await fetch(`/api/suppliers/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'same-origin' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.errors?.[0]?.message || result.message || 'Could not delete this supplier.')
      window.location.reload()
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not delete this supplier.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="flex items-center gap-3 whitespace-nowrap text-sm">
    <Link href={`/admin/collections/suppliers/${encodeURIComponent(id)}`} className="font-medium text-[#8b5d53] hover:underline">Edit</Link>
    <Link href={`/admin/collections/suppliers/${encodeURIComponent(id)}/manage-products`} className="font-medium text-[#8b5d53] hover:underline">Manage Products</Link>
    <button type="button" disabled={busy} onClick={() => void remove()} className="border-0 bg-transparent p-0 font-medium text-red-700 hover:underline disabled:opacity-50">{busy ? 'Deleting…' : 'Delete'}</button>
  </div>
}
