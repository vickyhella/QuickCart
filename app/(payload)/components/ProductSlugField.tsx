'use client'

import { useEffect, useRef } from 'react'
import { useAllFormFields, useField } from '@payloadcms/ui'

const slugify = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export function ProductSlugField({ path, readOnly }: { path: string; readOnly?: boolean }) {
  const { value, setValue } = useField<string>({ path })
  const [fields] = useAllFormFields()
  const previousGenerated = useRef('')
  const title = String(fields.title?.value || '')

  useEffect(() => {
    if (readOnly || !title.trim()) return
    const next = slugify(title)
    const current = String(value || '')
    if (!current || current === previousGenerated.current || current === slugify(title)) {
      if (next && next !== current) setValue(next)
      previousGenerated.current = next
    }
  }, [readOnly, setValue, title, value])

  return <div>
    <label htmlFor="product-slug" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Slug</label>
    <input id="product-slug" value={value || ''} readOnly={readOnly} onChange={(event) => setValue(event.target.value)} style={{ width: '100%', padding: 10, border: '1px solid var(--theme-elevation-300, #cbd5e1)', borderRadius: 5, background: 'var(--theme-input-bg, #fff)', color: 'var(--theme-text, #111827)' }} />
    <small style={{ display: 'block', marginTop: 5, color: 'var(--theme-elevation-600, #64748b)' }}>Generated from the product name. Edit it here if you want a custom URL.</small>
  </div>
}
