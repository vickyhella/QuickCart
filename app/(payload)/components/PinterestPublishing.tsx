'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type Product = { id: string; title: string; sku?: string; imageURL: string }
type Templates = { title: string; description: string }

function defaultSchedule() {
  const date = new Date(Date.now() + 60 * 60 * 1000)
  date.setMinutes(0, 0, 0)
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16)
}

export function PinterestPublishing() {
  const [products, setProducts] = useState<Product[]>([])
  const [templates, setTemplates] = useState<Templates>({ title: '', description: '' })
  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [scheduledAt, setScheduledAt] = useState(defaultSchedule)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/marketing/pinterest-publishing', { credentials: 'same-origin' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Could not load products.')
        setProducts(data.products || [])
        setTemplates(data.templates)
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Could not load products.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => products.filter((product) => `${product.title} ${product.sku || ''}`.toLowerCase().includes(search.toLowerCase())), [products, search])
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])

  const schedule = async () => {
    if (!selected.length || !scheduledAt) return
    setSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/marketing/pinterest-publishing', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIDs: selected, scheduledAt: new Date(scheduledAt).toISOString(), titleTemplate: templates.title, descriptionTemplate: templates.description }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not schedule posts.')
      const skipped = data.skipped?.length ? ` ${data.skipped.length} skipped: ${data.skipped.map((item: { title: string; reason: string }) => `${item.title} (${item.reason})`).join('; ')}` : ''
      setMessage(`${data.created} publishing post(s) scheduled.${skipped}`)
      setSelected([])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not schedule posts.')
    } finally {
      setSaving(false)
    }
  }

  return <section style={{ marginBlock: 24, padding: 20, border: '1px solid var(--theme-elevation-200)', borderRadius: 'var(--brand-radius-sm)' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div><h2 style={{ margin: 0 }}>Pinterest publishing</h2><p style={{ margin: '6px 0 0', color: 'var(--brand-text-secondary)' }}>Choose products and a publish time. Titles, descriptions, links, and main images are filled from your product and templates.</p></div>
      <Link className="btn btn--style-primary btn--size-medium" href="/admin/collections/pinterest-posts/">View scheduled publishing posts</Link>
    </div>

    <details style={{ marginTop: 18 }}>
      <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Publishing content rules</summary>
      <label style={{ display: 'block', marginTop: 12 }}>Pinterest title template
        <input value={templates.title} onChange={(event) => setTemplates((value) => ({ ...value, title: event.target.value }))} style={{ display: 'block', width: '100%', marginTop: 6 }} />
      </label>
      <label style={{ display: 'block', marginTop: 12 }}>Pinterest description template
        <textarea value={templates.description} onChange={(event) => setTemplates((value) => ({ ...value, description: event.target.value }))} rows={3} style={{ display: 'block', width: '100%', marginTop: 6 }} />
      </label>
      <p style={{ marginBottom: 0, color: 'var(--brand-text-secondary)' }}>Available tokens: {'{brand}'}, {'{productName}'}, {'{productType}'}, {'{length}'}, {'{shape}'}, {'{size}'}.</p>
    </details>

    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end', gap: 12, marginTop: 20 }}>
      <label style={{ flex: '1 1 220px' }}>Find products
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product name or SKU" style={{ display: 'block', width: '100%', marginTop: 6 }} />
      </label>
      <label>Publish time
        <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} style={{ display: 'block', marginTop: 6 }} />
      </label>
      <button type="button" className="btn btn--style-primary btn--size-medium" onClick={() => void schedule()} disabled={saving || !selected.length || !scheduledAt}>
        {saving ? 'Scheduling…' : `Add new publishing posts${selected.length ? ` (${selected.length})` : ''}`}
      </button>
    </div>

    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
      <button type="button" className="btn btn--style-secondary btn--size-small" onClick={() => setSelected((value) => [...new Set([...value, ...filtered.filter((product) => product.imageURL).map((product) => product.id)])])}>Select visible products</button>
      <button type="button" className="btn btn--style-secondary btn--size-small" onClick={() => setSelected([])}>Clear selection</button>
      <span style={{ alignSelf: 'center', color: 'var(--brand-text-secondary)' }}>Only published products with an image can be scheduled; product URLs and images are automatic.</span>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10, marginTop: 14, maxHeight: 360, overflow: 'auto' }}>
      {loading ? <p>Loading products…</p> : filtered.map((product) => <label key={product.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 9, border: `1px solid ${selected.includes(product.id) ? 'var(--theme-success-500)' : 'var(--theme-elevation-200)'}`, borderRadius: 'var(--brand-radius-sm)', cursor: product.imageURL ? 'pointer' : 'not-allowed', opacity: product.imageURL ? 1 : 0.65 }}>
        <input type="checkbox" checked={selected.includes(product.id)} disabled={!product.imageURL} onChange={() => toggle(product.id)} />
        <img src={product.imageURL || '/nail-placeholder.svg'} alt="" onError={(event) => { event.currentTarget.src = '/nail-placeholder.svg' }} style={{ width: 44, height: 52, objectFit: 'cover', borderRadius: 'var(--brand-radius-sm)' }} />
        <span style={{ minWidth: 0 }}><strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.title}</strong><small>{product.sku || 'No SKU'}</small></span>
      </label>)}
      {!loading && !filtered.length && <p>No published products match this search.</p>}
    </div>
    {message && <p role="status" style={{ marginBottom: 0 }}>{message}</p>}
  </section>
}
