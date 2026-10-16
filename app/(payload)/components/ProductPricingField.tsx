'use client'

import { useEffect, useRef, useState } from 'react'
import { useField } from '@payloadcms/ui'
import { getPriceDetails, toEditorPriceFields, toStoredPriceFields, type PriceFields } from '@/lib/product-pricing'

export function ProductPriceCell({ rowData }: { rowData: PriceFields }) {
  const pricing = getPriceDetails(rowData)
  if (pricing.currentPrice === null) return <>—</>
  return <span>
    <span aria-label={pricing.onSale ? 'Sale price' : 'Price'}>${pricing.currentPrice.toFixed(2)}</span>
    {pricing.onSale && <del aria-label="Price" style={{ marginLeft: 8, color: 'var(--brand-text-secondary)' }}>${pricing.price?.toFixed(2)}</del>}
  </span>
}

export function ProductPricingField({ path, readOnly }: { path: string; readOnly?: boolean }) {
  const [editor, setEditor] = useState({ price: '', salePrice: '' })
  const [edited, setEdited] = useState(false)
  const validate = () => {
    try { toStoredPriceFields(editor); return true }
    catch (error) { return error instanceof Error ? error.message : 'Invalid prices.' }
  }
  const current = useField<number | null>({ path, validate })
  const regular = useField<number | null>({ path: path.replace(/price$/, 'compareAtPrice') })
  const lastWritten = useRef<string | null>(null)

  useEffect(() => {
    const snapshot = JSON.stringify([current.value, regular.value])
    if (snapshot === lastWritten.current) return
    lastWritten.current = snapshot
    const prices = toEditorPriceFields({ price: current.value, compareAtPrice: regular.value })
    setEditor({ price: prices.price == null ? '' : String(prices.price), salePrice: prices.salePrice == null ? '' : String(prices.salePrice) })
    setEdited(false)
  }, [current.value, regular.value])

  const change = (key: 'price' | 'salePrice', value: string) => {
    const next = { ...editor, [key]: value }
    setEditor(next)
    setEdited(true)
    try {
      const stored = toStoredPriceFields(next)
      lastWritten.current = JSON.stringify([stored.price, stored.compareAtPrice])
      current.setValue(stored.price)
      regular.setValue(stored.compareAtPrice)
    } catch { /* Client field validation keeps invalid drafts from being submitted. */ }
  }
  const error = validate()
  const disabled = readOnly || current.disabled || regular.disabled
  return <div style={{ marginBottom: 24 }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
      {(['price', 'salePrice'] as const).map((key) => <label key={key} style={{ color: 'var(--brand-text-secondary)' }}>
        {key === 'price' ? 'Price' : 'Sale price (optional)'}
        <input aria-label={key === 'price' ? 'Price' : 'Sale price'} type="number" min="0" step="0.01" disabled={disabled} value={editor[key]} onWheel={(event) => event.currentTarget.blur()} onChange={(event) => change(key, event.target.value)} style={{ display: 'block', width: '100%', marginTop: 6, padding: 12, border: '1px solid var(--brand-border)', borderRadius: 'var(--brand-radius-sm)', color: 'var(--brand-text-primary)', background: 'var(--brand-surface)', font: 'inherit' }} />
      </label>)}
    </div>
    <p style={{ color: 'var(--brand-text-secondary)', fontSize: 'var(--brand-font-size-caption)' }}>Price is the regular price. Leave Sale price blank when the product is not on sale.</p>
    {((edited && error !== true) || current.showError) && <p role="alert" style={{ color: 'var(--brand-danger)' }}>{error !== true ? error : current.errorMessage}</p>}
  </div>
}
