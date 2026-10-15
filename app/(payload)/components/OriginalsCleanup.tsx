'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Analysis = {
  total: number
  unreferenced: number
  referenced: { filename: string; webpCount: number; productCount: number; pinCount: number; products: string[]; pins: string[] }[]
}

export function OriginalsCleanup() {
  const router = useRouter()
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [includeReferenced, setIncludeReferenced] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const refresh = async () => {
    setError('')
    try {
      const response = await fetch('/api/media/originals/cleanup', { credentials: 'same-origin', cache: 'no-store' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not inspect original images.')
      setAnalysis(result)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not inspect original images.')
    }
  }

  useEffect(() => { void refresh() }, [])

  const remove = async () => {
    const label = includeReferenced ? 'all originals, including ones used by products or Pinterest posts' : 'all unreferenced originals'
    if (!window.confirm(`Delete ${label}? WebP images will remain.`)) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/media/originals/cleanup', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeReferenced }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not delete original images.')
      setMessage(`Deleted ${result.deleted} original image(s); kept ${result.keptReferenced} referenced original(s). WebP images were not deleted.${result.failures?.length ? ` ${result.failures.length} failed: ${result.failures.join(' · ')}` : ''}`)
      await refresh()
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete original images.')
    } finally {
      setBusy(false)
    }
  }

  return <section style={{ marginBlock: 16, padding: 18, border: '1px solid var(--brand-border)', borderRadius: 'var(--brand-radius-sm)' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <h2 style={{ margin: '0 0 6px', fontSize: 'var(--brand-font-size-body)' }}>Original image cleanup</h2>
        <p style={{ margin: 0, fontSize: 'var(--brand-font-size-caption)', color: 'var(--brand-text-secondary)' }}>
          {analysis ? `${analysis.total} originals · ${analysis.unreferenced} safe to delete · ${analysis.referenced.length} used by product or Pinterest WebP images` : 'Checking references…'}
        </p>
      </div>
      <button type="button" onClick={() => void refresh()} disabled={busy} style={{ padding: '8px 12px', border: '1px solid var(--brand-border)', borderRadius: 'var(--brand-radius-sm)', background: 'var(--brand-surface)' }}>Refresh analysis</button>
    </div>
    {!!analysis?.referenced.length && <div style={{ marginTop: 12, fontSize: 'var(--brand-font-size-caption)' }}>
      <p style={{ margin: '0 0 6px' }}>Referenced originals are protected by default. Their WebP images will remain available if the original is deleted, but future re-compression from it will no longer be possible.</p>
      <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--brand-text-secondary)' }}>
        {analysis.referenced.slice(0, 8).map((item) => <li key={item.filename}>{item.filename} — Products: {item.products.join(', ') || 'none'}; Pins: {item.pins.join(', ') || 'none'}</li>)}
        {analysis.referenced.length > 8 && <li>and {analysis.referenced.length - 8} more</li>}
      </ul>
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 10 }}>
        <input type="checkbox" checked={includeReferenced} onChange={(event) => setIncludeReferenced(event.target.checked)} />
        <span>Also delete referenced originals. I understand the WebP stays, but it cannot be regenerated from its original.</span>
      </label>
    </div>}
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 14 }}>
      <button type="button" onClick={() => void remove()} disabled={busy || !analysis || (!analysis.unreferenced && !includeReferenced)} style={{ padding: '9px 14px', border: 0, borderRadius: 'var(--brand-radius-sm)', background: 'var(--brand-danger)', color: 'var(--brand-on-accent)', opacity: busy || !analysis || (!analysis.unreferenced && !includeReferenced) ? 0.5 : 1 }}>
        {busy ? 'Deleting…' : includeReferenced ? `Delete all ${analysis?.total ?? 0} originals` : `Delete ${analysis?.unreferenced ?? 0} unreferenced originals`}
      </button>
      {message && <p role="status" style={{ margin: 0, fontSize: 'var(--brand-font-size-caption)' }}>{message}</p>}
      {error && <p role="alert" style={{ margin: 0, color: 'var(--brand-danger)', fontSize: 'var(--brand-font-size-caption)' }}>{error}</p>}
    </div>
  </section>
}
