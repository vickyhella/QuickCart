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
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', border: '1px solid var(--brand-accent)', borderRadius: 'var(--brand-radius-sm)', background: 'var(--brand-surface)', color: 'var(--brand-accent)', cursor: replacing ? 'wait' : 'pointer' }}>
      {replacing ? 'Replacing image…' : 'Replace image used everywhere'}
      <input type="file" accept="image/*,.heic,.heif" disabled={replacing} onChange={(event) => { void replace(event.target.files?.[0]); event.currentTarget.value = '' }} style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} />
    </label>
    <button type="button" onClick={() => void reprocess()} disabled={busy} className="ui-button ui-button--primary">
      {busy ? 'Converting to WebP…' : 'Convert / regenerate WebP from original'}
    </button>
    <button type="button" onClick={() => setShowDeleteOptions(true)} disabled={deleting} className="ui-button ui-button--danger">
      {deleting ? 'Deleting…' : 'Delete image…'}
    </button>
    {showDeleteOptions && <div role="dialog" aria-modal="true" aria-labelledby="media-delete-title" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(0,0,0,.55)' }}>
      <section style={{ width: 'min(100%, 480px)', padding: 22, borderRadius: 'var(--brand-radius-md)', background: 'var(--brand-surface)', color: 'var(--brand-text-primary)', boxShadow: '0 18px 60px rgba(0,0,0,.25)' }}>
        <h2 id="media-delete-title" style={{ marginTop: 0 }}>Delete this image?</h2>
        <p>The WebP will be removed from storage and its product references will be cleared.</p>
        {hasOriginal ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" disabled={deleting} onClick={() => void deleteMedia(true)} className="ui-button ui-button--danger">Delete WebP and original</button>
          <button type="button" disabled={deleting} onClick={() => void deleteMedia(false)} className="ui-button ui-button--danger">Delete WebP only; keep original</button>
          <button type="button" disabled={deleting} onClick={() => setShowDeleteOptions(false)} className="ui-button ui-button--secondary">Cancel</button>
        </div> : <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" disabled={deleting} onClick={() => void deleteMedia(false)} className="ui-button ui-button--danger">Delete image</button>
          <button type="button" disabled={deleting} onClick={() => setShowDeleteOptions(false)} className="ui-button ui-button--secondary">Cancel</button>
        </div>}
      </section>
    </div>}
    {message && <span role="status" style={{ color: 'var(--brand-text-primary)' }}>{message}</span>}
  </div>
}
