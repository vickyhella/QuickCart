'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { useState } from 'react'

export function ProductDeleteControl() {
  const { id, collectionSlug } = useDocumentInfo()
  const [busy, setBusy] = useState(false)
  if (collectionSlug !== 'products' || !id) return null

  const remove = async () => {
    if (!window.confirm('Permanently delete this product? Images and originals used only by it will also be removed. Shared or referenced images will be kept.')) return
    setBusy(true)
    try {
      let response = await fetch(`/api/products/${encodeURIComponent(String(id))}/delete`, { method: 'DELETE', credentials: 'same-origin' })
      let result = await response.json()
      if (response.status === 409 && result.requiresForce) {
        const confirmed = window.confirm(`This product is referenced by ${result.referenceCount} order or Pinterest post record(s). Delete it anyway? Historical records remain; order title and price snapshots remain. Shared or referenced images will be kept.`)
        if (!confirmed) return
        response = await fetch(`/api/products/${encodeURIComponent(String(id))}/delete?force=true`, { method: 'DELETE', credentials: 'same-origin' })
        result = await response.json()
      }
      if (!response.ok) throw new Error(result.error || 'Could not delete this product.')
      window.location.assign('/admin/collections/products')
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not delete this product.')
    } finally {
      setBusy(false)
    }
  }

  return <button type="button" onClick={() => void remove()} disabled={busy} style={{ marginInlineStart: 8, padding: '8px 12px', border: '1px solid var(--brand-danger)', borderRadius: 'var(--brand-radius-sm)', background: 'transparent', color: 'var(--brand-danger)', cursor: busy ? 'wait' : 'pointer' }}>{busy ? 'Deleting…' : 'Delete product'}</button>
}
