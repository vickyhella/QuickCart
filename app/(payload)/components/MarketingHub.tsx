'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { DEFAULT_PRODUCT_SEO_DESCRIPTION, DEFAULT_PRODUCT_SEO_TITLE, resolveProductSeoTemplates } from '../../../lib/product-seo-templates'
import { uniqueLengthShapePairs } from '../../../lib/product-dimensions'
import { DEFAULT_STUDIO_DESCRIPTION_TEMPLATE, renderStudioDescription } from '../../../lib/studio-description-template'
import { AdminSearchableSelect } from './AdminSearchableSelect'

type Summary = { feedItems?: number; publishedProducts?: number; skippedPublishedProducts?: Array<{ title: string; reason: string }> }
type ReprocessableImage = { id: string; filename: string }
type MarketingSection = 'homepage' | 'feeds' | 'seo' | 'compression' | 'metadata'

export function MarketingHub({ section }: { section: MarketingSection }) {
  const [gmc, setGmc] = useState<Summary | null>(null)
  const [pinterest, setPinterest] = useState<Summary | null>(null)
  const [seo, setSeo] = useState<{ products: Array<Record<string, unknown>>; media: Array<Record<string, unknown>> }>({ products: [], media: [] })
  const [templates, setTemplates] = useState<Record<string, any>>({})
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reprocessImages, setReprocessImages] = useState<ReprocessableImage[]>([])
  const [reprocessQuality, setReprocessQuality] = useState(82)
  const [reprocessLoading, setReprocessLoading] = useState(false)
  const [reprocessProgress, setReprocessProgress] = useState<{ done: number; total: number } | null>(null)
  const [reprocessFailures, setReprocessFailures] = useState<Array<{ id: string; filename: string; error: string }>>([])
  const [saveMessage, setSaveMessage] = useState('')
  const [error, setError] = useState('')
  const descriptionPreview = renderStudioDescription(templates.studioDescriptionTemplate || DEFAULT_STUDIO_DESCRIPTION_TEMPLATE, {
    brand: 'Ginny Nana', productType: 'press-on nails', productName: 'Example product', length: 'Short', shape: 'Square',
    availableLengthShapeCombinations: 'Short Square, Medium Almond', availableSizes: 'XS, S, M, L',
  })
  const fieldStyle: CSSProperties = { boxSizing: 'border-box', width: '100%', minHeight: 44, padding: '10px 12px', border: '1px solid var(--brand-border)', borderRadius: 'var(--brand-radius-sm)', background: 'var(--brand-surface)', color: 'var(--brand-ink)', fontFamily: 'var(--font-body)', fontSize: 'var(--brand-font-size-control)' }
  const labelStyle: CSSProperties = { display: 'grid', gap: 8, minWidth: 0, color: 'var(--brand-text-primary)', fontWeight: 600 }
  const panelStyle: CSSProperties = { padding: '24px clamp(18px, 3vw, 32px)', marginBottom: 18, border: '1px solid var(--theme-elevation-200)', borderRadius: 'var(--brand-radius-md)', background: 'var(--brand-surface)' }
  const update = (key: string, value: string | number | boolean) => setTemplates((current) => ({ ...current, [key]: value }))

  useEffect(() => {
    let active = true
    Promise.all([
      fetch('/api/merchant/feed-preview', { credentials: 'same-origin' }).then((r) => r.ok ? r.json() : Promise.reject(new Error('GMC preview unavailable'))),
      fetch('/api/pinterest/feed-preview', { credentials: 'same-origin' }).then((r) => r.ok ? r.json() : Promise.reject(new Error('Pinterest preview unavailable'))),
      fetch('/api/products?limit=100&depth=1&sort=-updatedAt', { credentials: 'same-origin' }).then((r) => r.ok ? r.json() : { docs: [] }),
      fetch('/api/media?limit=1000&depth=0&sort=-createdAt', { credentials: 'same-origin' }).then((r) => r.ok ? r.json() : { docs: [] }),
    ]).then(([g, p, products, media]) => {
      if (active) {
        setGmc(g); setPinterest(p); setSeo({ products: products.docs || [], media: media.docs || [] })
      }
    }).catch((e) => { if (active) setError(e.message || 'Could not load marketing overview.') })
    fetch('/api/globals/marketing-settings', { credentials: 'same-origin' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Could not load saved Marketing settings.')))
      .then((settings: Record<string, any>) => {
        if (!active) return
        const seoTemplates = resolveProductSeoTemplates(settings)
        setTemplates({ ...settings, productTitleTemplate: seoTemplates.title, productDescriptionTemplate: seoTemplates.description })
      })
      .catch((e) => { if (active) setError(e.message || 'Could not load saved Marketing settings.') })
      .finally(() => { if (active) setSettingsLoading(false) })
    return () => { active = false }
  }, [section])

  useEffect(() => {
    if (section !== 'compression') return
    let active = true
    setReprocessLoading(true)
    fetch('/api/marketing/media-reprocessing', { credentials: 'same-origin', cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Could not inspect existing images.')
        if (active) { setReprocessImages(result.images || []); setReprocessQuality(result.quality || 82) }
      })
      .catch((cause) => { if (active) setSaveMessage(cause instanceof Error ? cause.message : 'Could not inspect existing images.') })
      .finally(() => { if (active) setReprocessLoading(false) })
    return () => { active = false }
  }, [section])

  const saveMarketingSettings = async (values: Record<string, unknown>) => {
    setSaving(true)
    setSaveMessage('')
    try {
      const settingsToSave = { ...templates, ...values }
      const arrivalDaysInput = settingsToSave.newArrivalDays ?? 30
      const arrivalDays = Number(arrivalDaysInput)
      if (arrivalDaysInput === '' || !Number.isInteger(arrivalDays) || arrivalDays < 0 || arrivalDays > 365) {
        throw new Error('Automatic New badge window must be a whole number from 0 to 365 days.')
      }
      settingsToSave.newArrivalDays = arrivalDays
      for (const key of ['homepageHeroImage', 'homepageHeroProduct', 'homepageMysteryBoxImage', 'homepageMysteryBoxProduct']) {
        const relation = settingsToSave[key]
        const relationID = relation && typeof relation === 'object' && 'id' in relation ? relation.id : relation
        settingsToSave[key] = typeof relationID === 'string' && /^\d+$/.test(relationID) ? Number(relationID) : relationID
        if (settingsToSave[key] === '') settingsToSave[key] = null
      }
      const response = await fetch('/api/globals/marketing-settings', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToSave),
      })
      const responseData = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(responseData.errors?.[0]?.message || responseData.error || 'Could not save Marketing settings. Please check your admin session and try again.')
      const saved = responseData.doc || responseData
      setTemplates((current) => ({ ...current, ...(saved || {}), ...values }))
      const savedQuality = Number(saved?.webpQuality ?? values.webpQuality)
      if (Number.isFinite(savedQuality) && savedQuality >= 1) setReprocessQuality(savedQuality)
      setSaveMessage('Settings saved.')
    } catch (e) {
      setSaveMessage(e instanceof Error ? e.message : 'Could not save settings.')
    } finally {
      setSaving(false)
    }
  }

  const reprocessExistingImages = async () => {
    const total = reprocessImages.length
    const quality = Number(templates.webpQuality ?? 82)
    if (!Number.isInteger(quality) || quality < 1 || quality > 100) {
      setSaveMessage('Enter a whole-number image quality from 1 to 100.')
      return
    }
    if (!total || !window.confirm(`Recompress ${total} existing images from their preserved originals at WebP quality ${quality}? This quality will be saved and used for the reprocessing. Product and variant image links will remain in place.`)) return
    setReprocessProgress({ done: 0, total })
    setReprocessFailures([])
    const filenames = new Map(reprocessImages.map((image) => [image.id, image.filename]))
    const failures: Array<{ id: string; filename: string; error: string }> = []
    try {
      for (let start = 0; start < total; start += 10) {
        const ids = reprocessImages.slice(start, start + 10).map((image) => image.id)
        const response = await fetch('/api/marketing/media-reprocessing', {
          method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, ...(start === 0 ? { quality } : {}) }),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Could not reprocess this image batch.')
        if (start === 0) {
          setReprocessQuality(quality)
          setTemplates((current) => ({ ...current, webpQuality: quality }))
        }
        for (const entry of result.results || []) {
          if (!entry.success) failures.push({ id: entry.id, filename: filenames.get(entry.id) || entry.id, error: entry.error || 'Reprocessing failed.' })
        }
        setReprocessProgress({ done: Math.min(start + ids.length, total), total })
        setReprocessFailures([...failures])
      }
      setSaveMessage(`Recompressed ${total - failures.length} of ${total} images at quality ${quality}.`)
      const refreshed = await fetch('/api/marketing/media-reprocessing', { credentials: 'same-origin', cache: 'no-store' }).then((response) => response.json())
      setReprocessImages(refreshed.images || [])
    } catch (cause) {
      setSaveMessage(cause instanceof Error ? cause.message : 'Image reprocessing stopped.')
    } finally {
      setReprocessProgress(null)
    }
  }

  return <div>
    {error && <p role="alert">{error}</p>}
    {section === 'feeds' && <>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 16 }}>
      {([{ name: 'Google Merchant Center', summary: gmc, feed: '/api/merchant/feed.xml' }, { name: 'Pinterest catalog', summary: pinterest, feed: '/api/pinterest/feed.xml' }]).map(({ name, summary, feed }) => <section key={name} style={{ padding: 20, border: '1px solid var(--theme-elevation-200)', borderRadius: 'var(--brand-radius-md)' }}>
        <h2>{name}</h2><p>{summary ? `${summary.publishedProducts ?? 0} published products · ${summary.feedItems ?? 0} feed items` : 'Loading preview…'}</p>
        {!!summary?.skippedPublishedProducts?.length && <p>{summary.skippedPublishedProducts.length} published products need attention.</p>}
        <a href={feed} target="_blank" rel="noreferrer">Open XML feed</a>{' · '}<a href={feed.includes('pinterest') ? '/pinterest-feed' : '/merchant-feed'} target="_blank" rel="noreferrer">Open visual preview</a>
      </section>)}
    </div>
    </>}
    {(section === 'homepage' || section === 'seo' || section === 'compression' || section === 'metadata') && (settingsLoading ? <p role="status">Loading saved Marketing settings…</p> : <>
        {section === 'homepage' && <>
        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Homepage hero</h2>
          <p style={{ lineHeight: 1.6 }}>Choose an image from the Media library and an optional published product to open when shoppers click the hero. Upload an image in <Link href="/admin/collections/media" style={{ textDecoration: 'underline' }}>Media</Link> first.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 20, marginTop: 22 }}>
            <label style={labelStyle}>Hero image
              <AdminSearchableSelect ariaLabel="Homepage hero image" options={seo.media.map((media) => ({ value: String(media.id), label: String(media.filename || media.altText || media.id), imageUrl: String(media.url || '') }))} value={String(templates.homepageHeroImage?.id ?? templates.homepageHeroImage ?? '')} onChange={(value) => update('homepageHeroImage', value)} placeholder="Use the first product image" style={fieldStyle} />
            </label>
            <label style={labelStyle}>Image alt text
              <input style={fieldStyle} value={templates.homepageHeroImageAlt || ''} onChange={(event) => update('homepageHeroImageAlt', event.target.value)} placeholder="Describe the image for screen readers" />
            </label>
            <label style={labelStyle}>Click-through product
              <select style={fieldStyle} value={String(templates.homepageHeroProduct?.id ?? templates.homepageHeroProduct ?? '')} onChange={(event) => update('homepageHeroProduct', event.target.value || '')}>
                <option value="">Use the first product</option>
                {seo.products.filter((product) => product.status === 'published').map((product) => <option key={String(product.id)} value={String(product.id)}>{String(product.title || product.name || product.id)}</option>)}
              </select>
            </label>
          </div>
          {(() => {
            const imageID = String(templates.homepageHeroImage?.id ?? templates.homepageHeroImage ?? '')
            const selectedImage = seo.media.find((media) => String(media.id) === imageID)
            return selectedImage?.url ? <img src={String(selectedImage.url)} alt="Selected homepage hero preview" style={{ display: 'block', width: 'min(100%, 720px)', maxHeight: 360, marginTop: 20, borderRadius: 'var(--brand-radius-sm)', objectFit: 'cover', objectPosition: 'center 28%' }} /> : null
          })()}
        </section>
        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Mystery Box feature</h2>
          <p style={{ lineHeight: 1.6 }}>Choose a published Mystery Box product to show a clickable feature on the homepage. Its product image is used unless you select a separate banner image.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 20, marginTop: 22 }}>
            <label style={labelStyle}>Published Mystery Box product
              <select style={fieldStyle} value={String(templates.homepageMysteryBoxProduct?.id ?? templates.homepageMysteryBoxProduct ?? '')} onChange={(event) => update('homepageMysteryBoxProduct', event.target.value || '')}>
                <option value="">Hide this homepage feature</option>
                {seo.products.filter((product) => product.status === 'published' && product.category === 'mystery-box').map((product) => <option key={String(product.id)} value={String(product.id)}>{String(product.title || product.name || product.id)}</option>)}
              </select>
            </label>
            <label style={labelStyle}>Optional banner image
              <AdminSearchableSelect ariaLabel="Optional banner image" options={seo.media.map((media) => ({ value: String(media.id), label: String(media.filename || media.altText || media.id), imageUrl: String(media.url || '') }))} value={String(templates.homepageMysteryBoxImage?.id ?? templates.homepageMysteryBoxImage ?? '')} onChange={(value) => update('homepageMysteryBoxImage', value)} placeholder="Use the product image" style={fieldStyle} />
            </label>
            <label style={labelStyle}>Image alt text
              <input style={fieldStyle} value={templates.homepageMysteryBoxImageAlt || ''} onChange={(event) => update('homepageMysteryBoxImageAlt', event.target.value)} placeholder="Describe the banner image" />
            </label>
            <label style={labelStyle}>Eyebrow
              <input style={fieldStyle} value={templates.homepageMysteryBoxEyebrow || ''} onChange={(event) => update('homepageMysteryBoxEyebrow', event.target.value)} />
            </label>
            <label style={labelStyle}>Headline
              <input style={fieldStyle} value={templates.homepageMysteryBoxTitle || ''} onChange={(event) => update('homepageMysteryBoxTitle', event.target.value)} />
            </label>
            <label style={labelStyle}>Description
              <textarea rows={3} style={{ ...fieldStyle, resize: 'vertical' }} value={templates.homepageMysteryBoxDescription || ''} onChange={(event) => update('homepageMysteryBoxDescription', event.target.value)} />
            </label>
          </div>
        </section>
        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>New arrivals</h2>
          <p style={{ lineHeight: 1.6 }}>Published products receive the automatic New badge for the selected window. Products manually marked New remain included after the window ends.</p>
          <label style={{ ...labelStyle, maxWidth: 360 }}>Automatic New badge window (days)
            <input style={fieldStyle} type="number" min={0} max={365} step={1} value={templates.newArrivalDays ?? 30} onChange={(event) => update('newArrivalDays', event.target.value === '' ? '' : Number(event.target.value))} />
          </label>
          <p style={{ marginBottom: 0, fontSize: 'var(--brand-font-size-caption)', color: 'var(--brand-text-secondary)' }}>Use 0 to turn off automatic badges; the product’s manual New checkbox still works.</p>
        </section>
        </>}
        {section === 'seo' && <>
        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Product description template</h2>
          <p style={{ lineHeight: 1.6 }}>Used by Product Studio when Description is set to Auto. Saving a changed template refreshes Auto fields; Custom descriptions stay unchanged.</p>
          <label style={labelStyle}>Studio Auto description
            <textarea rows={7} style={{ ...fieldStyle, minHeight: 180, resize: 'vertical' }} value={templates.studioDescriptionTemplate || DEFAULT_STUDIO_DESCRIPTION_TEMPLATE} onChange={(event) => update('studioDescriptionTemplate', event.target.value)} />
          </label>
          <p style={{ marginBottom: 8, color: 'var(--brand-text-secondary)', fontSize: 'var(--brand-font-size-caption)' }}>Markdown is supported: headings, **bold**, *italic*, lists, links, and tables.</p>
          <div aria-label="Description template preview" style={{ marginTop: 12, padding: 16, border: '1px solid var(--theme-elevation-200)', borderRadius: 'var(--brand-radius-sm)', background: 'var(--brand-soft)' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{descriptionPreview}</ReactMarkdown>
          </div>
          <p style={{ marginBottom: 0, color: 'var(--brand-text-secondary)', fontSize: 'var(--brand-font-size-caption)' }}>Tokens: {'{brand}'}, {'{productType}'}, {'{productName}'}, {'{length}'}, {'{shape}'}, {'{availableLengthShapeCombinations}'}, {'{availableSizes}'}.</p>
        </section>

        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Product SEO</h2>
          <p style={{ lineHeight: 1.6 }}>Defaults are used when a product has no custom SEO title or description. Edit the patterns here; the content preview below updates as you type.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 20, marginTop: 22 }}>
            <label style={labelStyle}>SEO title pattern
              <input style={fieldStyle} value={templates.productTitleTemplate || DEFAULT_PRODUCT_SEO_TITLE} onChange={(event) => update('productTitleTemplate', event.target.value)} />
            </label>
            <label style={labelStyle}>SEO description pattern
              <textarea rows={4} style={{ ...fieldStyle, minHeight: 112, resize: 'vertical' }} value={templates.productDescriptionTemplate || DEFAULT_PRODUCT_SEO_DESCRIPTION} onChange={(event) => update('productDescriptionTemplate', event.target.value)} />
            </label>
          </div>
          <p style={{ marginBottom: 0, color: 'var(--brand-text-secondary)', fontSize: 'var(--brand-font-size-caption)' }}>Available tokens: {'{brand}'}, {'{productType}'}, {'{productName}'}, {'{length}'}, {'{shape}'}, {'{size}'}, {'{availableLengthShapeCombinations}'}, {'{availableSizes}'}.</p>
        </section>
        </>}

        {section === 'metadata' && <>
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
          <p style={{ marginBottom: 0, color: 'var(--brand-text-secondary)', fontSize: 'var(--brand-font-size-caption)' }}>Available tokens: {'{brand}'}, {'{productType}'}, {'{productName}'}, {'{length}'}, {'{shape}'}, {'{size}'}, {'{number}'}.</p>
        </section>
        <section style={{ ...panelStyle, overflowX: 'auto' }}>
          <h2 style={{ marginTop: 0 }}>Current image metadata</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}><thead><tr><th>File</th><th>Title</th><th>Alt text</th><th>Caption</th></tr></thead><tbody>
            {seo.media.map((row) => <tr key={String(row.id)}><td><Link href={`/admin/collections/media/${row.id}`} style={{ textDecoration: 'underline' }}>{String(row.filename || '')}</Link></td><td>{String(row.title || '') || String(templates.imageTitleTemplate || '')}</td><td>{String(row.altText || '') || String(templates.imageAltTemplate || '')}</td><td>{String(row.caption || '') || String(templates.imageCaptionTemplate || '')}</td></tr>)}
          </tbody></table>
        </section>
        </>}

        {section === 'compression' && <>
        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Image compression</h2>
          <p style={{ lineHeight: 1.6 }}>Supported static images are stored as WebP, with the untouched original kept for reprocessing. Animated and vector images remain in their original format.</p>
          <label style={{ ...labelStyle, maxWidth: 420, marginTop: 20 }}>WebP quality (1–100)
            <input style={fieldStyle} type="number" min={1} max={100} step={1} value={templates.webpQuality ?? 82} onChange={(event) => update('webpQuality', event.target.value === '' ? '' : Number(event.target.value))} />
          </label>
          <p style={{ margin: '14px 0 8px', color: 'var(--brand-text-secondary)', fontSize: 'var(--brand-font-size-caption)' }}>{reprocessLoading ? 'Checking existing media…' : `${reprocessImages.length} existing image${reprocessImages.length === 1 ? '' : 's'} can be rebuilt from preserved originals. The entered quality will be saved when reprocessing starts. Temporary images and GIF/SVG files are excluded.`}</p>
          <button type="button" disabled={saving || reprocessLoading || Boolean(reprocessProgress) || !reprocessImages.length} onClick={() => void reprocessExistingImages()} className="ui-button ui-button--secondary">{reprocessProgress ? `Recompressing ${reprocessProgress.done} / ${reprocessProgress.total}…` : `Recompress ${reprocessImages.length} existing images`}</button>
          {!!reprocessFailures.length && <div role="alert" style={{ marginTop: 12, color: 'var(--brand-danger)', fontSize: 'var(--brand-font-size-caption)' }}><strong>{reprocessFailures.length} image(s) failed:</strong><ul>{reprocessFailures.map((failure) => <li key={failure.id}>{failure.filename}: {failure.error}</li>)}</ul></div>}
        </section>
        </>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <button type="button" disabled={saving} onClick={() => void saveMarketingSettings(templates)} className="ui-button ui-button--primary">{saving ? 'Saving…' : section === 'homepage' ? 'Save homepage settings' : section === 'seo' ? 'Save SEO templates' : section === 'metadata' ? 'Save image metadata templates' : 'Save compression settings'}</button>
          {saveMessage && <span role="status">{saveMessage}</span>}
        </div>
        {section === 'seo' && <section style={{ marginTop: 22, padding: 20, border: '1px solid var(--theme-elevation-200)', borderRadius: 'var(--brand-radius-md)', overflowX: 'auto' }}>
          <h2>Current SEO content</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}><thead><tr><th>Product</th><th>SEO title</th><th>SEO description</th></tr></thead><tbody>
            {seo.products.map((row) => {
              const variants = Array.isArray(row.variants) ? row.variants.filter((variant: any) => variant?.enabled !== false) : []
              const combinations = uniqueLengthShapePairs(variants)
              const sizes = [...new Set(variants.map((variant: any) => String(variant.size || '').toUpperCase()).filter(Boolean))].join(', ')
              const values: Record<string, string> = {
                brand: String(row.brand || 'Ginny Nana'), productType: String(row.category || 'press-on-nails').replaceAll('-', ' '), productName: String(row.title || ''),
                length: [...new Set(combinations.map((combo) => combo.length))].join(', '), shape: [...new Set(combinations.map((combo) => combo.shape))].join(', '), size: sizes,
                availableLengthShapeCombinations: combinations.map((combo) => `${combo.length} ${combo.shape}`).join(', '), availableSizes: sizes,
              }
              const render = (template: string) => String(template || '').replace(/\{(brand|productType|productName|length|shape|size|availableLengthShapeCombinations|availableSizes)\}/g, (_, token) => values[token] || '').replace(/\s+/g, ' ').trim()
              return <tr key={String(row.id)}><td><Link href={`/admin/collections/products/${row.id}`} style={{ textDecoration: 'underline' }}>{String(row.title || '')}</Link></td><td>{String(row.seoTitle || '') || render(templates.productTitleTemplate || DEFAULT_PRODUCT_SEO_TITLE)}</td><td>{String(row.seoDescription || '') || render(templates.productDescriptionTemplate || DEFAULT_PRODUCT_SEO_DESCRIPTION)}</td></tr>
            })}
          </tbody></table>
        </section>}
    </>
    )}
  </div>
}
