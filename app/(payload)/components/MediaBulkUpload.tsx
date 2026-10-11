'use client'

import { useState } from 'react'

export function MediaBulkUpload() {
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const upload = async (files: FileList | File[]) => {
    if (!files.length) return
    setBusy(true)
    const failures: string[] = []
    let count = 0
    for (const file of Array.from(files)) {
      const form = new FormData()
      form.append('file', file)
      try {
        const response = await fetch('/api/media', { method: 'POST', credentials: 'same-origin', body: form })
        const result = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(result.errors?.[0]?.message || result.message || `HTTP ${response.status}`)
        count += 1
      } catch (error) {
        failures.push(`${file.name}: ${error instanceof Error ? error.message : 'upload failed'}`)
      }
    }
    setMessage(`${count} image${count === 1 ? '' : 's'} uploaded.${failures.length ? ` ${failures.length} failed: ${failures.join(' · ')}` : ''}`)
    setBusy(false)
    if (count) window.location.reload()
  }

  return <section style={{ marginBlock: 16, padding: 18, border: '1px solid var(--theme-elevation-300, #cbd5e1)', borderRadius: 8 }}>
    <h2 style={{ margin: '0 0 6px', fontSize: 16 }}>Upload multiple images</h2>
    <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--theme-elevation-600, #64748b)' }}>Drop several images here or browse. Image title and alt text start from each filename and can be edited after upload.</p>
    <div onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); void upload(event.dataTransfer.files) }} style={{ padding: 20, textAlign: 'center', border: `1px dashed ${dragging ? '#9b5c72' : 'var(--theme-elevation-400, #94a3b8)'}`, borderRadius: 7, background: dragging ? 'rgba(155,92,114,.08)' : 'transparent' }}>
      <label style={{ cursor: 'pointer' }}>{busy ? 'Uploading images…' : 'Drop files or browse'}<input type="file" accept="image/*" multiple disabled={busy} onChange={(event) => { if (event.target.files) void upload(event.target.files); event.currentTarget.value = '' }} style={{ display: 'none' }} /></label>
    </div>
    {message && <p role="status" style={{ marginBottom: 0, fontSize: 12 }}>{message}</p>}
  </section>
}
