'use client'

import { useEffect, useState } from 'react'

export function ProductThumbnailCell({ cellData }: { cellData?: unknown }) {
  const initial = cellData && typeof cellData === 'object' && 'url' in cellData ? String((cellData as { url?: string }).url || '') : ''
  const [url, setUrl] = useState(initial || '/nail-placeholder.svg')
  useEffect(() => {
    if (initial) { setUrl(initial); return }
    const id = cellData && typeof cellData === 'object' && 'id' in cellData ? String((cellData as { id: string | number }).id) : String(cellData || '')
    if (!id) { setUrl('/nail-placeholder.svg'); return }
    let active = true
    fetch(`/api/media/${encodeURIComponent(id)}?depth=0`, { credentials: 'same-origin' }).then((response) => response.ok ? response.json() : null).then((media) => { if (active && media?.url) setUrl(media.url) }).catch(() => {})
    return () => { active = false }
  }, [cellData, initial])
  return <div style={{ width: 48, height: 48, display: 'grid', placeItems: 'center', overflow: 'hidden', borderRadius: 6, background: 'var(--theme-elevation-100)' }}>
    <img src={url} alt="Product image or placeholder" onError={() => setUrl('/nail-placeholder.svg')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  </div>
}
