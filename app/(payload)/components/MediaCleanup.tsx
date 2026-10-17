'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Analysis = { total: number; unreferenced: number; referenced: number }

export function MediaCleanup() {
  const router = useRouter()
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const refresh = () => fetch('/api/media/cleanup', { credentials: 'same-origin', cache: 'no-store' })
    .then(async (response) => {
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not inspect images.')
      setAnalysis(result)
      setError('')
    }).catch((cause) => {
      setAnalysis(null)
      setError(cause instanceof Error ? cause.message : 'Could not inspect images.')
    }).finally(() => {
      setChecking(false)
    })

  useEffect(() => { void refresh() }, [])

  const remove = async () => {
    if (busy || checking || !analysis?.unreferenced) return
    if (!window.confirm(`Permanently delete ${analysis.unreferenced} unreferenced image(s) and their originals? Originals still used by other images will be kept. This cannot be undone.`)) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/media/cleanup', { method: 'POST', credentials: 'same-origin' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not delete images.')
      setMessage(`Deleted ${result.deleted} image(s) and ${result.deletedOriginals} original(s); kept ${result.keptReferenced} referenced image(s) and ${result.keptSharedOriginals} shared original(s).${result.failures?.length ? ` ${result.failures.length} failed: ${result.failures.join(' · ')}` : ''}`)
      await refresh()
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete images.')
    } finally {
      setBusy(false)
    }
  }

  return <section style={{ marginBlock: 16, padding: 18, border: '1px solid var(--brand-border)', borderRadius: 'var(--brand-radius-sm)' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <h2 style={{ margin: '0 0 6px', fontSize: 'var(--brand-font-size-body)' }}>Unused image cleanup</h2>
        <p style={{ margin: 0, fontSize: 'var(--brand-font-size-caption)', color: 'var(--brand-text-secondary)' }}>
          {analysis ? `${analysis.total} images · ${analysis.unreferenced} unreferenced · ${analysis.referenced} used by products or Pinterest posts` : checking ? 'Checking references…' : 'Refresh analysis to check references.'}
        </p>
      </div>
      <button type="button" onClick={() => { setChecking(true); void refresh() }} disabled={busy || checking} style={{ padding: '8px 12px', border: '1px solid var(--brand-border)', borderRadius: 'var(--brand-radius-sm)', background: 'var(--brand-surface)' }}>Refresh analysis</button>
    </div>
    <p style={{ margin: '12px 0 0', fontSize: 'var(--brand-font-size-caption)', color: 'var(--brand-text-secondary)' }}>Deletes unused images and their originals permanently. Product and Pinterest images are protected. Originals shared with remaining images are kept.</p>
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 14 }}>
      <button type="button" onClick={() => void remove()} disabled={busy || checking || !analysis?.unreferenced} style={{ padding: '9px 14px', border: 0, borderRadius: 'var(--brand-radius-sm)', background: 'var(--brand-danger)', color: 'var(--brand-on-accent)', opacity: busy || checking || !analysis?.unreferenced ? 0.5 : 1 }}>
        {busy ? 'Deleting…' : `Delete ${analysis?.unreferenced ?? 0} unreferenced images + originals`}
      </button>
      {message && <p role="status" style={{ margin: 0, fontSize: 'var(--brand-font-size-caption)' }}>{message}</p>}
      {error && <p role="alert" style={{ margin: 0, color: 'var(--brand-danger)', fontSize: 'var(--brand-font-size-caption)' }}>{error}</p>}
    </div>
  </section>
}
