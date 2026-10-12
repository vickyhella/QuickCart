'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAllFormFields, useField } from '@payloadcms/ui'

type MediaDoc = {
  id: string | number
  filename?: string | null
  mimeType?: string | null
  url?: string | null
  title?: string | null
}

type Props = {
  path: string
  readOnly?: boolean
  field?: { hasMany?: boolean; label?: string }
  label?: string
}

function relationID(value: unknown): string {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if ('id' in record) return String(record.id)
    if ('value' in record) return relationID(record.value)
  }
  return value === null || value === undefined || value === '' ? '' : String(value)
}

export function ProductMediaField({ path, readOnly, field, label }: Props) {
  const hasMany = Boolean(field?.hasMany)
  const { value, setValue } = useField<unknown>({ path })
  const [formFields] = useAllFormFields()
  const [media, setMedia] = useState<MediaDoc[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const currentIDs = useMemo(() => {
    const entries = hasMany ? (Array.isArray(value) ? value : []) : [value]
    return entries.map(relationID).filter(Boolean)
  }, [hasMany, value])
  const allProductMediaIDs = useMemo(() => {
    const gallery = Array.isArray(formFields.gallery?.value) ? formFields.gallery.value : []
    const variants = Array.isArray(formFields.variants?.value) ? formFields.variants.value as Array<Record<string, unknown>> : []
    const ids = [
      ...currentIDs,
      relationID(formFields.featuredImage?.value),
      ...gallery.map(relationID),
      ...variants.map((variant) => relationID(variant.image)),
    ]
    return [...new Set(ids.filter(Boolean))]
  }, [currentIDs, formFields.featuredImage?.value, formFields.gallery?.value, formFields.variants?.value])
  const selectedIDKey = allProductMediaIDs.join(',')
  const productID = typeof window === 'undefined' ? '' : window.location.pathname.match(/\/admin\/collections\/products\/([^/]+)/)?.[1] || ''
  const visibleMedia = useMemo(() => media.filter((item) => item.mimeType === 'image/webp' || currentIDs.includes(String(item.id))), [media, currentIDs])
  const selectedMedia = currentIDs.map((id) => visibleMedia.find((item) => String(item.id) === id)).filter((item): item is MediaDoc => Boolean(item))

  useEffect(() => {
    let active = true
    fetch('/api/media?limit=1000&depth=0&sort=filename', { credentials: 'same-origin' })
      .then(async (response) => response.ok ? response.json() : { docs: [] })
      .then((result) => { if (active) setMedia(Array.isArray(result.docs) ? result.docs : []) })
      .catch(() => { if (active) setMedia([]) })
    return () => { active = false }
  }, [])

  // On a new product, Payload only assigns an ID after its first save. Once
  // that save redirects to the edit URL, attach the selected media records.
  useEffect(() => {
    if (!productID || productID === 'create' || productID === 'bulk-edit' || !allProductMediaIDs.length) return
    void fetch(`/api/products/${encodeURIComponent(productID)}/link-media`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaIDs: allProductMediaIDs }),
    })
  }, [productID, selectedIDKey, allProductMediaIDs])

  const updateSelection = (ids: string[]) => {
    const payloadIDs = ids.map((id) => media.find((item) => String(item.id) === id)?.id ?? id)
    setValue(hasMany ? payloadIDs : payloadIDs[0] ?? null)
  }

  const uploadFiles = async (files: FileList | File[]) => {
    const selectedFiles = Array.from(files).slice(0, hasMany ? 20 : 1)
    if (!selectedFiles.length) return
    setBusy(true)
    setMessage(`Uploading and preparing ${selectedFiles.length} image${selectedFiles.length === 1 ? '' : 's'}…`)
    try {
      const uploaded: MediaDoc[] = []
      for (const file of selectedFiles) {
        const body = new FormData()
        body.append('file', file)
        const productID = window.location.pathname.match(/\/admin\/collections\/products\/([^/]+)/)?.[1]
        if (productID && productID !== 'create' && productID !== 'bulk-edit') body.append('product', productID)
        const productTitle = String(formFields.title?.value || '').trim()
        if (productTitle) {
          body.append('title', productTitle)
          body.append('altText', productTitle)
        }
        const response = await fetch('/api/media', { method: 'POST', credentials: 'same-origin', body })
        const result = await response.json().catch(() => ({}))
        if (!response.ok || !result.doc) throw new Error(result.errors?.[0]?.message || result.message || 'Image upload failed.')
        uploaded.push(result.doc as MediaDoc)
      }
      setMedia((current) => [...uploaded, ...current.filter((item) => !uploaded.some((entry) => String(entry.id) === String(item.id)))])
      updateSelection(hasMany ? [...currentIDs, ...uploaded.map((item) => String(item.id))] : [String(uploaded[0].id)])
      setMessage(`${uploaded.length} image${uploaded.length === 1 ? '' : 's'} uploaded and ready.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Image upload failed.')
    } finally {
      setBusy(false)
    }
  }

  const toggle = (id: string) => {
    if (!hasMany) {
      updateSelection(id ? [id] : [])
      return
    }
    updateSelection(currentIDs.includes(id) ? currentIDs.filter((item) => item !== id) : [...currentIDs, id])
  }

  return <div style={{ marginBlock: 14 }}>
    <label style={{ display: 'block', marginBottom: 7, fontWeight: 600 }}>{label || field?.label || (hasMany ? 'Product gallery' : 'Featured image')}</label>
    {selectedMedia.length > 0 ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
      {selectedMedia.map((item) => <div key={item.id} style={{ position: 'relative', width: 96 }}>
        <img src={item.url || '/nail-placeholder.svg'} alt={item.title || item.filename || ''} onError={(event) => { event.currentTarget.src = '/nail-placeholder.svg' }} style={{ width: 96, height: 112, objectFit: 'cover', borderRadius: 6, border: '1px solid #d1d5db' }} />
        <small style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.filename || item.title || `Image ${item.id}`}</small>
        {!readOnly && <button type="button" onClick={() => toggle(String(item.id))} aria-label="Remove image" style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, border: 0, borderRadius: 12, background: '#fff', color: '#111827', cursor: 'pointer' }}>×</button>}
      </div>)}
    </div> : <p style={{ margin: '0 0 10px', color: '#6b7280' }}>No image selected.</p>}

    {!readOnly && <>
      <div onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void uploadFiles(event.dataTransfer.files) }} style={{ padding: 14, border: '1px dashed #9ca3af', borderRadius: 6, marginBottom: 10, color: '#4b5563' }}>
        Drop image{hasMany ? 's' : ''} here or <label style={{ color: '#7c4058', textDecoration: 'underline', cursor: busy ? 'wait' : 'pointer' }}>browse<input type="file" accept="image/*,.heic,.heif" multiple={hasMany} disabled={busy} onChange={(event) => { if (event.currentTarget.files) void uploadFiles(event.currentTarget.files); event.currentTarget.value = '' }} style={{ display: 'none' }} /></label>
        {busy && <span> — converting and uploading…</span>}
      </div>
      {visibleMedia.length > 0 && (hasMany ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, maxHeight: 220, overflow: 'auto' }}>
        {visibleMedia.map((item) => <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 6, border: '1px solid #e5e7eb', borderRadius: 5, cursor: 'pointer' }}><input type="checkbox" checked={currentIDs.includes(String(item.id))} onChange={() => toggle(String(item.id))} /><img src={item.url || '/nail-placeholder.svg'} alt="" style={{ width: 34, height: 40, objectFit: 'cover' }} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>{item.filename || item.title || item.id}</span></label>)}
      </div> : <select aria-label="Choose an existing image" value={currentIDs[0] || ''} onChange={(event) => updateSelection(event.target.value ? [event.target.value] : [])} style={{ maxWidth: '100%', padding: 8 }}><option value="">Choose an existing image…</option>{visibleMedia.map((item) => <option key={item.id} value={String(item.id)}>{item.filename || item.title || item.id}</option>)}</select>)}
    </>}
    {message && <p role="status" style={{ margin: '8px 0 0', color: /failed|invalid|could not/i.test(message) ? '#b91c1c' : '#4b5563' }}>{message}</p>}
  </div>
}
