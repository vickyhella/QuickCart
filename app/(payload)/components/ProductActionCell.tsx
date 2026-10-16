'use client'

import Link from 'next/link'
import { useState } from 'react'

export function ProductActionCell({
  rowData,
}: {
  rowData?: { id?: string | number; title?: string }
}) {
  const [busy, setBusy] = useState(false)
  if (!rowData?.id) return null
  const id = String(rowData.id)
  const title = rowData.title || 'this product'

  async function remove(force = false) {
    setBusy(true)
    try {
      const response = await fetch(
        `/api/products/${encodeURIComponent(id)}/delete${force ? '?force=true' : ''}`,
        { method: 'DELETE', credentials: 'same-origin' },
      )
      const result = await response.json()
      if (response.status === 409 && result.requiresForce) {
        if (
          window.confirm(
            `This product is referenced by ${result.referenceCount} order or Pinterest post record(s). Delete it anyway? Historical records remain; shared or referenced images will be kept.`,
          )
        )
          await remove(true)
        return
      }
      if (!response.ok)
        throw new Error(result.error || 'Could not delete this product.')
      window.location.reload()
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : 'Could not delete this product.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-3 whitespace-nowrap text-sm">
      <Link
        href={`/admin/collections/products/${encodeURIComponent(id)}`}
        className="font-medium text-[#8b5d53] hover:underline"
      >
        Edit
      </Link>
      <Link
        href={`/admin/collections/products/studio?duplicate=${encodeURIComponent(id)}`}
        className="font-medium text-[#8b5d53] hover:underline"
      >
        Duplicate
      </Link>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          if (
            window.confirm(
              `Permanently delete “${title}” and images used only by this product?`,
            )
          )
            void remove()
        }}
        className="border-0 bg-transparent p-0 font-medium text-red-700 hover:underline disabled:opacity-50"
      >
        {busy ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  )
}
