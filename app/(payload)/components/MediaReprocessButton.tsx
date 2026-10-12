'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function MediaReprocessButton() {
  const { id, collectionSlug, data, setData } = useDocumentInfo()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [replacing, setReplacing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteOptions, setShowDeleteOptions] = useState(false)
  const [message, setMessage] = useState('')
  if (collectionSlug !== 'media' || !id) return null
  const sourceOriginal = data?.sourceOriginal
  const hasOriginal = Boolean(sourceOriginal && (typeof sourceOriginal !== 'object' || 'id' in sourceOriginal))

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
      if (result.doc) setData({ ...data, ...result.doc })
      setMessage(`Converted from the preserved original at WebP quality ${result.quality}.`)
      router.refresh()
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
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not replace this image.')
    } finally {
      setReplacing(false)
    }
  }

  const deleteMedia = async (deleteOriginal: boolean) => {
    setDeleting(true)
    setMessage('')
    try {
      const response = await fetch(`/api/media/${encodeURIComponent(String(id))}/delete`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteOriginal }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not delete this image.')
      router.push('/admin/collections/media/')
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not delete this image.')
    } finally {
      setDeleting(false)
      setShowDeleteOptions(false)
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
    <button type="button" onClick={() => setShowDeleteOptions(true)} disabled={deleting} style={{ padding: '9px 14px', border: '1px solid #b91c1c', borderRadius: 5, background: '#fff', color: '#991b1b', cursor: deleting ? 'wait' : 'pointer' }}>
      {deleting ? 'Deleting…' : 'Delete image…'}
    </button>
    {showDeleteOptions && <div role="dialog" aria-modal="true" aria-labelledby="media-delete-title" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(0,0,0,.55)' }}>
      <section style={{ width: 'min(100%, 480px)', padding: 22, borderRadius: 10, background: '#fff', color: '#1f2937', boxShadow: '0 18px 60px rgba(0,0,0,.25)' }}>
        <h2 id="media-delete-title" style={{ marginTop: 0 }}>Delete this image?</h2>
        <p>The WebP will be removed from storage and its product references will be cleared.</p>
        {hasOriginal ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" disabled={deleting} onClick={() => void deleteMedia(true)} style={{ padding: '9px 12px', border: 0, borderRadius: 5, background: '#991b1b', color: '#fff' }}>Delete WebP and original</button>
          <button type="button" disabled={deleting} onClick={() => void deleteMedia(false)} style={{ padding: '9px 12px', border: '1px solid #9ca3af', borderRadius: 5, background: '#fff', color: '#1f2937' }}>Delete WebP only; keep original</button>
          <button type="button" disabled={deleting} onClick={() => setShowDeleteOptions(false)} style={{ padding: '9px 12px', border: '1px solid #9ca3af', borderRadius: 5, background: '#fff', color: '#1f2937' }}>Cancel</button>
        </div> : <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" disabled={deleting} onClick={() => void deleteMedia(false)} style={{ padding: '9px 12px', border: 0, borderRadius: 5, background: '#991b1b', color: '#fff' }}>Delete image</button>
          <button type="button" disabled={deleting} onClick={() => setShowDeleteOptions(false)} style={{ padding: '9px 12px', border: '1px solid #9ca3af', borderRadius: 5, background: '#fff', color: '#1f2937' }}>Cancel</button>
        </div>}
      </section>
    </div>}
    {message && <span role="status" style={{ color: '#332b2e' }}>{message}</span>}
  </div>
}
