'use client'

import { useField } from '@payloadcms/ui'
import { useState } from 'react'

function safeURL(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`
    const url = new URL(normalized)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

export function PurchaseURLField({ path, readOnly, label, field }: { path: string; readOnly?: boolean; label?: string; field?: { label?: string } }) {
  const { value, setValue } = useField<string>({ path })
  const href = safeURL(value)

  return <div className="field-type text">
    <label className="field-label" htmlFor={path}>{label || field?.label || 'Purchase URL'}</label>
    <input className="field-input" id={path} type="url" value={value || ''} onChange={(event) => setValue(event.currentTarget.value)} disabled={readOnly} />
    {href && <div className="field-description"><a href={href} target="_blank" rel="noopener noreferrer">打开链接 ↗</a></div>}
  </div>
}

export function ProductPurchaseURLField({ path, readOnly, label, field }: { path: string; readOnly?: boolean; label?: string; field?: { label?: string } }) {
  const { value, setValue } = useField<string>({ path })
  const [editing, setEditing] = useState(false)
  const text = typeof value === 'string' ? value : ''
  const href = safeURL(text)
  const fieldLabel = label || field?.label || 'Product Purchase URL'

  return <div className="field-type text">
    <label className="field-label" htmlFor={path}>{fieldLabel}</label>
    {text.trim() && !editing ? <div className="field-description">
      {href ? <a href={href} target="_blank" rel="noopener noreferrer">{text} ↗</a> : <span>{text}</span>}
      {!readOnly && <button type="button" onClick={() => setEditing(true)} style={{ marginInlineStart: 12 }}>编辑</button>}
    </div> : <input className="field-input" id={path} type="url" value={text} onChange={(event) => setValue(event.currentTarget.value)} onBlur={() => { if (text.trim()) setEditing(false) }} disabled={readOnly} />}
  </div>
}

export function PurchaseURLCell({ cellData, rowData }: { cellData?: unknown; rowData?: { purchaseURL?: unknown } }) {
  const value = typeof cellData === 'string' && cellData ? cellData : rowData?.purchaseURL
  if (typeof value !== 'string' || !value.trim()) return <>—</>
  const href = safeURL(value)
  return href
    ? <a href={href} target="_blank" rel="noopener noreferrer" title={value} style={{ display: 'block', maxWidth: 360, overflowWrap: 'anywhere' }}>{value}</a>
    : <span title={value}>{value}</span>
}

export function ProductPurchaseURLCell({ cellData, rowData }: { cellData?: unknown; rowData?: { purchaseURL?: unknown } }) {
  const value = typeof cellData === 'string' && cellData ? cellData : rowData?.purchaseURL
  if (typeof value !== 'string' || !value.trim()) return <>—</>
  const href = safeURL(value)
  return href
    ? <a href={href} target="_blank" rel="noopener noreferrer" title={value} aria-label="Open product purchase URL in a new tab">Link ↗</a>
    : <span title={value}>{value}</span>
}
