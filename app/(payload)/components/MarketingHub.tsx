'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { shippingCountries } from '../../../lib/countries'

type Summary = { feedItems?: number; publishedProducts?: number; skippedPublishedProducts?: Array<{ title: string; reason: string }> }

export function MarketingHub() {
  const [gmc, setGmc] = useState<Summary | null>(null)
  const [pinterest, setPinterest] = useState<Summary | null>(null)
  const [seo, setSeo] = useState<{ products: Array<Record<string, unknown>>; media: Array<Record<string, unknown>> }>({ products: [], media: [] })
  const [templates, setTemplates] = useState<Record<string, any>>({})
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'feeds' | 'seo' | 'countries'>('feeds')

  useEffect(() => {
    const requested = searchParams.get('tab')
    if (requested === 'feeds' || requested === 'seo' || requested === 'countries') setTab(requested)
  }, [searchParams])

  useEffect(() => {
    let active = true
    Promise.all([
      fetch('/api/merchant/feed-preview', { credentials: 'same-origin' }).then((r) => r.ok ? r.json() : Promise.reject(new Error('GMC preview unavailable'))),
      fetch('/api/pinterest/feed-preview', { credentials: 'same-origin' }).then((r) => r.ok ? r.json() : Promise.reject(new Error('Pinterest preview unavailable'))),
      fetch('/api/products?limit=100&depth=1&sort=-updatedAt', { credentials: 'same-origin' }).then((r) => r.ok ? r.json() : { docs: [] }),
      fetch('/api/media?limit=100&depth=0&sort=-createdAt', { credentials: 'same-origin' }).then((r) => r.ok ? r.json() : { docs: [] }),
      fetch('/api/globals/marketing-settings', { credentials: 'same-origin' }).then((r) => r.ok ? r.json() : {}),
    ]).then(([g, p, products, media, settings]) => {
      if (active) {
        const loadedSettings = settings as Record<string, any>
        setGmc(g); setPinterest(p); setSeo({ products: products.docs || [], media: media.docs || [] })
        setTemplates(loadedSettings || {})
        const selected: string[] = Array.isArray(loadedSettings?.availableCountries) && loadedSettings.availableCountries.length
          ? loadedSettings.availableCountries
          : shippingCountries.map(([code]) => code)
        setSelectedCountries(selected)
      }
    }).catch((e) => { if (active) setError(e.message || 'Could not load marketing overview.') })
    return () => { active = false }
  }, [])

  const saveMarketingSettings = async (values: Record<string, unknown>) => {
    setSaving(true)
    setSaveMessage('')
    try {
      const response = await fetch('/api/globals/marketing-settings', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...templates, availableCountries: selectedCountries, ...values }),
      })
      if (!response.ok) throw new Error('Could not save Marketing settings. Please check your admin session and try again.')
      const responseData = await response.json()
      const saved = responseData.doc || responseData
      setTemplates(saved || {})
      const countries = Array.isArray(saved?.availableCountries) ? saved.availableCountries : selectedCountries
      setSelectedCountries(countries)
      setSaveMessage('Settings saved.')
    } catch (e) {
      setSaveMessage(e instanceof Error ? e.message : 'Could not save settings.')
    } finally {
      setSaving(false)
    }
  }

  return <main style={{ padding: '32px clamp(20px, 4vw, 56px)', maxWidth: 1320, margin: '0 auto' }}>
    <p style={{ margin: 0, color: '#d5a4b5', textTransform: 'uppercase', letterSpacing: '.16em', fontSize: 12 }}>Store growth</p>
    <h1 style={{ margin: '8px 0 24px' }}>Marketing</h1>
    {error && <p role="alert">{error}</p>}
    <div role="tablist" aria-label="Marketing sections" style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--theme-elevation-200)', marginBottom: 20 }}>
      {([{ id: 'feeds', label: 'Feeds' }, { id: 'seo', label: 'SEO & Media' }, { id: 'countries', label: 'Countries' }] as const).map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} style={{ padding: '10px 16px', border: 0, borderBottom: tab === item.id ? '2px solid #8b5e70' : '2px solid transparent', background: 'transparent', color: 'var(--theme-text)', cursor: 'pointer', fontWeight: tab === item.id ? 600 : 400 }}>{item.label}</button>)}
    </div>
    {tab === 'feeds' && <>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 16 }}>
      {([{ name: 'Google Merchant Center', summary: gmc, feed: '/api/merchant/feed.xml' }, { name: 'Pinterest catalog', summary: pinterest, feed: '/api/pinterest/feed.xml' }]).map(({ name, summary, feed }) => <section key={name} style={{ padding: 20, border: '1px solid var(--theme-elevation-200)', borderRadius: 12 }}>
        <h2>{name}</h2><p>{summary ? `${summary.publishedProducts ?? 0} published products · ${summary.feedItems ?? 0} feed items` : 'Loading preview…'}</p>
        {!!summary?.skippedPublishedProducts?.length && <p>{summary.skippedPublishedProducts.length} published products need attention.</p>}
        <a href={feed} target="_blank" rel="noreferrer">Open XML feed</a>{' · '}<a href={feed.includes('pinterest') ? '/pinterest-feed' : '/merchant-feed'} target="_blank" rel="noreferrer">Open visual preview</a>
      </section>)}
    </div>
    </>}
    {tab === 'seo' && <>
    {(() => {
      const fieldStyle: CSSProperties = { boxSizing: 'border-box', width: '100%', minHeight: 44, padding: '10px 12px', border: '1px solid #c9c4c2', borderRadius: 6, background: '#fff', color: '#261f22', font: 'inherit' }
      const labelStyle: CSSProperties = { display: 'grid', gap: 8, minWidth: 0, color: 'var(--theme-text, #f5edf0)', fontWeight: 600 }
      const panelStyle: CSSProperties = { padding: '24px clamp(18px, 3vw, 32px)', marginBottom: 18, border: '1px solid var(--theme-elevation-200)', borderRadius: 12, background: 'var(--theme-elevation-0, #fff)' }
      const update = (key: string, value: string | number | boolean) => setTemplates((current) => ({ ...current, [key]: value }))
      return <>
        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Product SEO</h2>
          <p style={{ lineHeight: 1.6 }}>Defaults are used when a product has no custom SEO title or description. Edit the patterns here; the content preview below updates as you type.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 20, marginTop: 22 }}>
            <label style={labelStyle}>SEO title pattern
              <input style={fieldStyle} value={templates.productTitleTemplate || '{brand} {productType} {productName} {length} {shape}'} onChange={(event) => update('productTitleTemplate', event.target.value)} />
            </label>
            <label style={labelStyle}>SEO description pattern
              <textarea rows={4} style={{ ...fieldStyle, minHeight: 112, resize: 'vertical' }} value={templates.productDescriptionTemplate || '{productName} press-on nails by {brand}.'} onChange={(event) => update('productDescriptionTemplate', event.target.value)} />
            </label>
          </div>
          <p style={{ marginBottom: 0, color: '#d1c4c9', fontSize: 13 }}>Available tokens: {'{brand}'}, {'{productType}'}, {'{productName}'}, {'{length}'}, {'{shape}'}, {'{size}'}.</p>
        </section>

        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Image names and metadata</h2>
          <p style={{ lineHeight: 1.6 }}>These defaults are applied to new uploads when the corresponding field is left blank.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 20, marginTop: 22 }}>
            <label style={labelStyle}>Filename pattern
              <input style={fieldStyle} value={templates.imageFilenameTemplate || '{brand}-{productType}-{productName}-{length}-{shape}-{number}'} onChange={(event) => update('imageFilenameTemplate', event.target.value)} />
            </label>
            <label style={labelStyle}>Image title pattern
              <input style={fieldStyle} value={templates.imageTitleTemplate || '{brand} {productName} {length} {shape} press-on nails'} onChange={(event) => update('imageTitleTemplate', event.target.value)} />
            </label>
            <label style={labelStyle}>Alt text pattern
              <input style={fieldStyle} value={templates.imageAltTemplate || '{brand} {productName} press-on nails in {length} length and {shape} shape'} onChange={(event) => update('imageAltTemplate', event.target.value)} />
            </label>
            <label style={labelStyle}>Caption pattern
              <input style={fieldStyle} value={templates.imageCaptionTemplate || '{productName} press-on nails by {brand}'} onChange={(event) => update('imageCaptionTemplate', event.target.value)} />
            </label>
          </div>
          <p style={{ marginBottom: 0, color: '#d1c4c9', fontSize: 13 }}>Available tokens: {'{brand}'}, {'{productType}'}, {'{productName}'}, {'{length}'}, {'{shape}'}, {'{size}'}, {'{number}'}.</p>
        </section>

        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Image compression</h2>
          <p style={{ lineHeight: 1.6 }}>Keep the original upload as the source and serve a WebP version for faster storefront delivery. HEIC uploads are converted to WebP when the converter is available.</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, color: '#f5edf0', fontWeight: 600 }}>
            <input type="checkbox" checked={templates.compressImagesToWebP !== false} onChange={(event) => update('compressImagesToWebP', event.target.checked)} style={{ accentColor: '#c989a0' }} /> Convert supported uploads to WebP
          </label>
          <label style={{ ...labelStyle, maxWidth: 420, marginTop: 20 }}>WebP quality (1–100)
            <input style={fieldStyle} type="number" min={1} max={100} value={templates.webpQuality || 82} onChange={(event) => update('webpQuality', Number(event.target.value))} />
          </label>
        </section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <button type="button" disabled={saving} onClick={() => void saveMarketingSettings(templates)} style={{ padding: '12px 18px', border: 0, borderRadius: 6, background: '#74495a', color: '#fff', fontWeight: 600, cursor: saving ? 'wait' : 'pointer' }}>{saving ? 'Saving…' : 'Save SEO & Media settings'}</button>
          {saveMessage && <span role="status">{saveMessage}</span>}
        </div>
      </>
    })()}
    <section style={{ marginTop: 22, padding: 20, border: '1px solid var(--theme-elevation-200)', borderRadius: 12, overflowX: 'auto' }}>
      <h2>Current SEO content</h2><h3>Products</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}><thead><tr><th>Product</th><th>SEO title</th><th>SEO description</th></tr></thead><tbody>
        {seo.products.map((row) => {
          const values: Record<string, string> = { brand: String(row.brand || 'Ginny Nana'), productType: String(row.category || 'press-on-nails').replaceAll('-', ' '), productName: String(row.title || ''), length: String(row.length || ''), shape: String(row.shape || ''), size: '' }
          const render = (template: string) => String(template || '').replace(/\{(brand|productType|productName|length|shape|size)\}/g, (_, token) => values[token] || '').replace(/\s+/g, ' ').trim()
          return <tr key={String(row.id)}><td><Link href={`/admin/collections/products/${row.id}`} style={{ textDecoration: 'underline' }}>{String(row.title || '')}</Link></td><td>{String(row.seoTitle || '') || render(templates.productTitleTemplate || '{brand} {productType} {productName} {length} {shape}')}</td><td>{String(row.seoDescription || '') || render(templates.productDescriptionTemplate || '{productName} press-on nails by {brand}.')}</td></tr>
        })}
      </tbody></table>
      <h3 style={{ marginTop: 24 }}>Media</h3><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}><thead><tr><th>File</th><th>Title</th><th>Alt text</th><th>Caption</th></tr></thead><tbody>
        {seo.media.map((row) => <tr key={String(row.id)}><td><Link href={`/admin/collections/media/${row.id}`} style={{ textDecoration: 'underline' }}>{String(row.filename || '')}</Link></td><td>{String(row.title || '') || String(templates.imageTitleTemplate || '')}</td><td>{String(row.altText || '') || String(templates.imageAltTemplate || '')}</td><td>{String(row.caption || '') || String(templates.imageCaptionTemplate || '')}</td></tr>)}
      </tbody></table>
    </section>
    </>}
    {tab === 'countries' && <section style={{ padding: 20, border: '1px solid var(--theme-elevation-200)', borderRadius: 12 }}>
      <h2>Available countries</h2><p>These countries are enabled for checkout and should match GMC data-source targeting and shipping setup.</p>
      <div style={{ columns: '2 240px', margin: '18px 0' }}>{shippingCountries.map(([code, name]) => <label key={code} style={{ display: 'flex', gap: 8, alignItems: 'center', breakInside: 'avoid', padding: '5px 0' }}><input type="checkbox" checked={selectedCountries.includes(code)} onChange={(event) => setSelectedCountries((current) => event.target.checked ? [...current, code] : current.filter((item) => item !== code))} />{name} ({code})</label>)}</div>
      <button type="button" disabled={saving} onClick={() => void saveMarketingSettings({})}>{saving ? 'Saving…' : 'Save available countries'}</button>
      {saveMessage && <p role="status">{saveMessage}</p>}
    </section>}
  </main>
}
