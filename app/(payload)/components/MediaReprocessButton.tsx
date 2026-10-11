'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { useState } from 'react'

export function MediaReprocessButton() {
  const { id, collectionSlug } = useDocumentInfo()
  const [busy, setBusy] = useState(false)
  const [replacing, setReplacing] = useState(false)
  const [message, setMessage] = useState('')
  if (collectionSlug !== 'media' || !id) return null

  const reprocess = async () => {
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(`/api/media/${encodeURIComponent(String(id))}/reprocess`, {
        method: 'POST',
        credentials: 'same-origin',
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not regenerate this image.')
      setMessage(`Converted from the preserved original at WebP quality ${result.quality}.`)
      window.location.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not regenerate this image.')
    } finally {
      setBusy(false)
    }
  }

  const replace = async (file?: File) => {
    if (!file) return
    setReplacing(true)
    setMessage('')
    try {
      const body = new FormData()
      body.set('file', file)
      const response = await fetch(`/api/media/${encodeURIComponent(String(id))}/replace`, { method: 'POST', body, credentials: 'same-origin' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not replace this image.')
      setMessage('Image replaced. All product and variant references to this media item now use the replacement.')
      window.location.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not replace this image.')
    } finally {
      setReplacing(false)
    }
  }

  return <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBlock: 12 }}>
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', border: '1px solid #8b5e70', borderRadius: 5, background: '#fff', color: '#5d3747', cursor: replacing ? 'wait' : 'pointer' }}>
      {replacing ? 'Replacing image…' : 'Replace image used everywhere'}
      <input type="file" accept="image/*,.heic,.heif" disabled={replacing} onChange={(event) => { void replace(event.target.files?.[0]); event.currentTarget.value = '' }} style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} />
    </label>
    <button type="button" onClick={() => void reprocess()} disabled={busy} style={{ padding: '9px 14px', border: '1px solid #8b5e70', borderRadius: 5, background: '#8b5e70', color: '#fff', cursor: busy ? 'wait' : 'pointer' }}>
      {busy ? 'Converting to WebP…' : 'Convert / regenerate WebP from original'}
    </button>
    {message && <span role="status" style={{ color: '#332b2e' }}>{message}</span>}
  </div>
}
