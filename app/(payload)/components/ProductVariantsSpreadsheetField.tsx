'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAllFormFields, useField } from '@payloadcms/ui'

type Media = { id: string | number; filename?: string | null; mimeType?: string | null; url?: string | null }
type Variant = {
  id?: string
  sku?: string
  length: string
  shape: string
  size: string
  price?: number | null
  compareAtPrice?: number | null
  image?: string | number | Media | null
  stock?: number
  trackStock?: boolean
  enabled?: boolean
}
type CellRange = { startRow: number; endRow: number; startColumn: number; endColumn: number }

const columns: Array<{ key: keyof Variant; label: string }> = [
  { key: 'sku', label: 'SKU' },
  { key: 'length', label: 'Length' },
  { key: 'shape', label: 'Shape' },
  { key: 'size', label: 'Size' },
  { key: 'price', label: 'Price' },
  { key: 'compareAtPrice', label: 'Compare at' },
  { key: 'stock', label: 'Stock' },
  { key: 'image', label: 'Variant image' },
  { key: 'trackStock', label: 'Track stock' },
  { key: 'enabled', label: 'Enabled' },
]

const presets = {
  shape: ['square', 'oval', 'almond', 'round'],
  length: ['x-short', 'short', 'medium', 'long', 'x-long'],
  size: ['xs', 's', 'm', 'l'],
}

function parseTSV(input: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let value = ''
  let quoted = false
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]
    if (char === '"') {
      if (quoted && input[i + 1] === '"') { value += '"'; i += 1 }
      else quoted = !quoted
    } else if (char === '\t' && !quoted) { row.push(value); value = '' }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && input[i + 1] === '\n') i += 1
      row.push(value); rows.push(row); row = []; value = ''
    } else value += char
  }
  row.push(value)
  if (row.some(Boolean) || rows.length === 0) rows.push(row)
  return rows
}

function imageID(value: unknown): string {
  if (value && typeof value === 'object' && 'id' in value) return String((value as Media).id)
  return value === null || value === undefined ? '' : String(value)
}

function dimensionCode(value: string, presetsMap: Record<string, string>, values: string[]) {
  if (presetsMap[value]) return presetsMap[value]
  const customValues = [...new Set(values.filter((item) => !presetsMap[item]))].sort()
  return String(50 + Math.max(0, customValues.indexOf(value))).padStart(2, '0')
}

export function ProductVariantsSpreadsheetField({ path, readOnly }: { path: string; readOnly?: boolean }) {
  const { value, setValue } = useField<Variant[]>({ path })
  const { setValue: setProductLength } = useField<string>({ path: 'length' })
  const { setValue: setProductShape } = useField<string>({ path: 'shape' })
  const [fields] = useAllFormFields()
  const rows = Array.isArray(value) ? value : []
  const [media, setMedia] = useState<Media[]>([])
  const [dimensions, setDimensions] = useState<{ shape: string[]; length: string[]; size: string[] }>({ shape: ['almond'], length: ['short'], size: ['xs', 's', 'm'] })
  const [dimensionsInitialized, setDimensionsInitialized] = useState(false)
  const [range, setRange] = useState<CellRange | null>(null)
  const [message, setMessage] = useState('')
  const [spreadsheetHref, setSpreadsheetHref] = useState('')
  const hasEdited = useRef(false)

  const productSKU = String(fields.sku?.value || '')
  const productCode = /^\d{4}$/.test(productSKU) ? productSKU : ''
  const featuredImage = imageID(fields.featuredImage?.value)
  const mediaOptions = useMemo(() => {
    const selectedIDs = new Set([featuredImage, ...rows.map((variant) => imageID(variant.image))].filter(Boolean))
    return media.filter((item) => item.filename && (item.mimeType === 'image/webp' || selectedIDs.has(String(item.id))))
  }, [featuredImage, media, rows])

  useEffect(() => {
    if (!dimensionsInitialized && rows.length) {
      setDimensions({
        shape: [...new Set(rows.map((row) => row.shape).filter(Boolean))],
        length: [...new Set(rows.map((row) => row.length).filter(Boolean))],
        size: [...new Set(rows.map((row) => row.size || 's'))].sort((a, b) => presets.size.indexOf(a) - presets.size.indexOf(b)),
      })
      setDimensionsInitialized(true)
    }
  }, [dimensionsInitialized, rows])

  useEffect(() => {
    let alive = true
    fetch('/api/media?limit=1000&depth=0&sort=filename', { credentials: 'same-origin' })
      .then((response) => response.ok ? response.json() : { docs: [] })
      .then((result) => { if (alive) setMedia(result.docs || []) })
      .catch(() => { if (alive) setMedia([]) })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    const productID = window.location.pathname.match(/\/admin\/collections\/products\/([^/]+)/)?.[1]
    if (productID && productID !== 'create' && productID !== 'bulk-edit') {
      setSpreadsheetHref(`/admin/collections/products/bulk-edit/?product=${encodeURIComponent(productID)}`)
      fetch(`/api/products/${encodeURIComponent(productID)}?depth=0`, { credentials: 'same-origin' })
        .then((response) => response.ok ? response.json() : null)
        .then((product) => {
          if (!product || hasEdited.current || !Array.isArray(product.variants)) return
          setValue(product.variants)
          const lengths = [...new Set(product.variants.map((variant: Variant) => variant.length).filter(Boolean))]
          const shapes = [...new Set(product.variants.map((variant: Variant) => variant.shape).filter(Boolean))]
          setProductLength(lengths.join(', '))
          setProductShape(shapes.join(', '))
        })
        .catch(() => {})
    }
  }, [setProductLength, setProductShape, setValue])

  const updateRows = useCallback((next: Variant[]) => {
    if (readOnly) return
    hasEdited.current = true
    setValue(next)
    const lengths = [...new Set(next.map((variant) => variant.length).filter(Boolean))]
    const shapes = [...new Set(next.map((variant) => variant.shape).filter(Boolean))]
    setProductLength(lengths.join(', '))
    setProductShape(shapes.join(', '))
    setMessage('Unsaved variant changes. Save the product to apply them.')
  }, [readOnly, setProductLength, setProductShape, setValue])

  const updateCell = (rowIndex: number, key: keyof Variant, rawValue: string | boolean) => {
    const next = [...rows]
    const row = { ...next[rowIndex] }
    if (key === 'price' || key === 'compareAtPrice') row[key] = String(rawValue).trim() === '' ? null : Number(rawValue)
    else if (key === 'stock') row.stock = Number(rawValue || 0)
    else if (key === 'trackStock' || key === 'enabled') row[key] = Boolean(rawValue)
    else if (key === 'image') row.image = rawValue === '' ? null : String(rawValue)
    else row[key] = String(rawValue) as never
    next[rowIndex] = row
    updateRows(next)
  }

  const syncCombinations = () => {
    const old = new Map(rows.map((variant) => [`${variant.shape}|${variant.length}|${variant.size || 's'}`, variant]))
    const sizes = dimensions.size.length ? dimensions.size : ['xs', 's', 'm']
    const shapes = dimensions.shape.length ? dimensions.shape : ['almond']
    const lengths = dimensions.length.length ? dimensions.length : ['short']
    const lengthCodes: Record<string, string> = { 'x-short': '01', short: '02', medium: '03', long: '04', 'x-long': '05' }
    const shapeCodes: Record<string, string> = { square: '01', oval: '02', almond: '03', round: '04' }
    const sizeCodes: Record<string, string> = { xs: '01', s: '02', m: '03', l: '04' }
    const next: Variant[] = []
    for (const shape of shapes) for (const length of lengths) for (const size of sizes) {
      const key = `${shape}|${length}|${size}`
      next.push(old.get(key) || {
        sku: productCode ? `${productCode}-${dimensionCode(length, lengthCodes, lengths)}-${dimensionCode(shape, shapeCodes, shapes)}-${sizeCodes[size] || '02'}` : '',
        shape, length, size, price: null, compareAtPrice: null,
        image: featuredImage || null, stock: 10, trackStock: true, enabled: true,
      })
    }
    updateRows(next)
    setMessage(`${next.length} combinations ready. Existing matching variant values were kept; save the product to apply.`)
  }

  const uploadImage = async (file: File, rowIndex: number) => {
    setMessage(`Uploading and converting ${file.name}…`)
    const variant = rows[rowIndex]
    const extension = file.name.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() || ''
    const nameParts = [
      String(fields.brand?.value || 'Ginny Nana'),
      String(fields.category?.value || 'Press-on Nails').replaceAll('-', ' '),
      String(fields.title?.value || 'New Product'),
      variant.length,
      variant.shape,
      variant.size,
    ].filter(Boolean).map((part) => String(part).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase())
    const base = nameParts.join('-')
    const safeBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const safeExtension = extension.replace('.', '\\.')
    const existingNumbers = media.flatMap((item) => {
      const match = (item.filename || '').match(new RegExp(`^${safeBase}-(\\d+)${safeExtension}$`, 'i'))
      return match ? [Number(match[1])] : []
    })
    const filename = `${base}-${String(Math.max(0, ...existingNumbers) + 1).padStart(2, '0')}${extension}`
    const renamed = new File([file], filename, { type: file.type, lastModified: file.lastModified })
    const body = new FormData()
    body.append('file', renamed)
    body.append('title', `${String(fields.title?.value || 'New Product')} · ${variant.length} ${variant.shape} ${variant.size?.toUpperCase()}`)
    body.append('altText', `${String(fields.brand?.value || 'Ginny Nana')} ${String(fields.title?.value || 'New Product')}, ${variant.length} ${variant.shape} ${variant.size?.toUpperCase()} nails`)
    body.append('caption', `${variant.length} ${variant.shape} ${variant.size?.toUpperCase()} variant image`)
    const productID = window.location.pathname.match(/\/admin\/collections\/products\/([^/]+)/)?.[1]
    if (productID && productID !== 'create') body.append('product', productID)
    const response = await fetch('/api/media', { method: 'POST', credentials: 'same-origin', body })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(result.errors?.[0]?.message || result.message || 'Image upload failed')
    const uploaded = result.doc as Media
    setMedia((current) => [uploaded, ...current.filter((item) => String(item.id) !== String(uploaded.id))])
    updateCell(rowIndex, 'image', String(uploaded.id))
    setMessage(uploaded.mimeType === 'image/webp' ? `${uploaded.filename || file.name} is ready as WebP.` : `${uploaded.filename || file.name} uploaded in its original format.`)
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    const rowStart = Number(target.dataset.variantRow)
    const columnStart = Number(target.dataset.variantColumn)
    if (!Number.isInteger(rowStart) || !Number.isInteger(columnStart)) return
    const matrix = parseTSV(event.clipboardData.getData('text/plain'))
    if (matrix.length === 1 && matrix[0].length === 1) return
    event.preventDefault()
    const next = [...rows]
    matrix.forEach((line, rowOffset) => line.forEach((cell, columnOffset) => {
      const rowIndex = rowStart + rowOffset
      const column = columns[columnStart + columnOffset]
      if (!column) return
      while (next.length <= rowIndex) next.push({ sku: '', shape: '', length: '', size: 's', price: null, compareAtPrice: null, stock: 10, image: null, trackStock: true, enabled: true })
      const row = { ...next[rowIndex] }
      const key = column.key
      if (key === 'price' || key === 'compareAtPrice') row[key] = cell.trim() ? Number(cell) : null
      else if (key === 'stock') row.stock = Number(cell || 0)
      else if (key === 'trackStock' || key === 'enabled') row[key] = ['true', '1', 'yes', 'y', '✓'].includes(cell.trim().toLowerCase())
      else if (key === 'image') row.image = media.find((item) => String(item.id) === cell.trim() || item.filename === cell.trim())?.id || cell.trim() || null
      else row[key] = cell as never
      next[rowIndex] = row
    }))
    updateRows(next)
  }

  const handleCopy = (event: React.ClipboardEvent<HTMLDivElement>) => {
    if (!range) return
    const top = Math.min(range.startRow, range.endRow)
    const bottom = Math.max(range.startRow, range.endRow)
    const left = Math.min(range.startColumn, range.endColumn)
    const right = Math.max(range.startColumn, range.endColumn)
    const quote = (text: string) => /[\t\r\n"]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
    const tsv = rows.slice(top, bottom + 1).map((row) => columns.slice(left, right + 1).map(({ key }) => {
      const current = row[key]
      if (key === 'image') return quote(media.find((item) => String(item.id) === imageID(current))?.filename || imageID(current))
      return quote(current === null || current === undefined ? '' : String(current))
    }).join('\t')).join('\n')
    event.preventDefault()
    event.clipboardData.setData('text/plain', tsv)
  }

  const styles: Record<string, React.CSSProperties> = {
    input: { width: '100%', minWidth: 80, padding: '7px 8px', border: '1px solid var(--theme-elevation-300, #cbd5e1)', borderRadius: 4, background: 'var(--theme-input-bg, #fff)', color: 'var(--theme-text, #111827)' },
    th: { padding: 8, textAlign: 'left', borderBottom: '2px solid var(--theme-elevation-300, #cbd5e1)', whiteSpace: 'nowrap', fontSize: 12 },
    td: { padding: 5, borderBottom: '1px solid var(--theme-elevation-100, #e5e7eb)', verticalAlign: 'top' },
    button: { padding: '8px 12px', border: '1px solid var(--theme-elevation-300, #cbd5e1)', borderRadius: 5, background: 'var(--theme-elevation-0, #fff)', color: 'var(--theme-text, #111827)', cursor: 'pointer' },
  }

  return <div style={{ marginBlock: 12 }}>
    {spreadsheetHref && <p style={{ marginBlock: '0 12px' }}><a className="btn btn--style-secondary btn--size-medium" href={spreadsheetHref}>Open this product in the full spreadsheet editor</a></p>}
    <p style={{ margin: '0 0 12px', color: 'var(--theme-elevation-700, #475569)' }}>
      Select dimensions, sync combinations, then edit or paste a tab-separated range in the table. Matching variants keep their existing SKU, price, stock, and image. New rows use the product image and stock 10 by default.
    </p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 }}>
      {(['shape', 'length', 'size'] as const).map((dimension) => <fieldset key={dimension} style={{ border: '1px solid var(--theme-elevation-300, #cbd5e1)', borderRadius: 6, padding: 10, minWidth: 0 }}>
        <legend style={{ paddingInline: 5, textTransform: 'capitalize', fontWeight: 600 }}>{dimension}</legend>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>{[...new Set([...presets[dimension], ...dimensions[dimension]])].map((option) => <label key={option} style={{ display: 'inline-flex', gap: 4, alignItems: 'center', fontSize: 13, textTransform: 'capitalize' }}><input type="checkbox" disabled={readOnly} checked={dimensions[dimension].includes(option)} onChange={(event) => setDimensions((current) => ({ ...current, [dimension]: event.target.checked ? [...new Set([...current[dimension], option])] : current[dimension].filter((value) => value !== option) }))} />{option.replace('-', ' ')}</label>)}</div>
        {dimension !== 'size' && <input disabled={readOnly} aria-label={`Add ${dimension}`} placeholder={`Add ${dimension}, press Enter`} onKeyDown={(event) => { if (event.key !== 'Enter') return; event.preventDefault(); const input = event.currentTarget; const option = input.value.trim().toLowerCase().replace(/\s+/g, '-'); if (!option) return; setDimensions((current) => ({ ...current, [dimension]: [...new Set([...current[dimension], option])] })); input.value = '' }} style={{ ...styles.input, marginTop: 8 }} />}
      </fieldset>)}
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <button type="button" disabled={readOnly} onClick={syncCombinations} style={styles.button}>Sync combinations &amp; generate SKUs</button>
      <button type="button" disabled={readOnly} onClick={() => updateRows([...rows, { sku: '', shape: dimensions.shape[0] || 'almond', length: dimensions.length[0] || 'short', size: dimensions.size[0] || 's', price: null, compareAtPrice: null, image: featuredImage || null, stock: 10, trackStock: true, enabled: true }])} style={styles.button}>+ Add one variant</button>
      <span style={{ color: 'var(--theme-elevation-600, #64748b)', fontSize: 12 }}>{rows.length} variant(s)</span>
    </div>
    {message && <p role="status" style={{ color: 'var(--theme-elevation-700, #475569)', fontSize: 12 }}>{message}</p>}
    <div style={{ overflowX: 'auto', border: '1px solid var(--theme-elevation-200, #e2e8f0)', borderRadius: 6 }} onPaste={handlePaste} onCopy={handleCopy}>
      <table style={{ width: '100%', minWidth: 1250, borderCollapse: 'collapse' }}>
        <thead><tr>{columns.map((column) => <th key={column.key} style={styles.th}>{column.label}</th>)}<th style={styles.th}>Remove</th></tr></thead>
        <tbody>{rows.map((variant, rowIndex) => <tr key={variant.id || `${variant.sku}-${rowIndex}`}>
          {columns.map((column, columnIndex) => <td key={column.key} style={styles.td} onMouseDown={() => setRange({ startRow: rowIndex, endRow: rowIndex, startColumn: columnIndex, endColumn: columnIndex })} onMouseEnter={() => setRange((current) => current ? { ...current, endRow: rowIndex, endColumn: columnIndex } : current)}>
            {column.key === 'size' ? <select data-variant-row={rowIndex} data-variant-column={columnIndex} disabled={readOnly} value={variant.size || 's'} onChange={(event) => updateCell(rowIndex, 'size', event.target.value)} style={styles.input}>{presets.size.map((size) => <option key={size} value={size}>{size.toUpperCase()}</option>)}</select>
              : column.key === 'image' ? <><select data-variant-row={rowIndex} data-variant-column={columnIndex} disabled={readOnly} value={imageID(variant.image)} onChange={(event) => updateCell(rowIndex, 'image', event.target.value)} style={{ ...styles.input, minWidth: 190 }}><option value="">Use product image</option>{mediaOptions.map((item) => <option key={item.id} value={String(item.id)}>{item.filename}</option>)}</select><img src={media.find((item) => String(item.id) === imageID(variant.image))?.url || '/nail-placeholder.svg'} onError={(event) => { event.currentTarget.src = '/nail-placeholder.svg' }} alt="Variant preview" style={{ display: 'block', marginTop: 5, width: 52, height: 52, objectFit: 'cover' }} /><label style={{ display: 'block', fontSize: 11, marginTop: 5 }}>Upload<input type="file" accept="image/*" disabled={readOnly} onChange={(event) => { const input = event.currentTarget; const file = input.files?.[0]; if (file) void uploadImage(file, rowIndex).catch((error) => setMessage(error.message)); input.value = '' }} /></label></>
              : column.key === 'trackStock' || column.key === 'enabled' ? <input data-variant-row={rowIndex} data-variant-column={columnIndex} type="checkbox" disabled={readOnly} checked={Boolean(variant[column.key] ?? (column.key === 'enabled'))} onChange={(event) => updateCell(rowIndex, column.key, event.target.checked)} />
                : <input data-variant-row={rowIndex} data-variant-column={columnIndex} disabled={readOnly} aria-label={`${column.label} variant ${rowIndex + 1}`} type={['price', 'compareAtPrice', 'stock'].includes(String(column.key)) ? 'number' : 'text'} min="0" value={variant[column.key] === null || variant[column.key] === undefined ? '' : String(variant[column.key])} placeholder={column.key === 'price' ? 'Product price' : ''} onChange={(event) => updateCell(rowIndex, column.key, event.target.value)} style={styles.input} />}
          </td>)}
          <td style={styles.td}><button type="button" disabled={readOnly} onClick={() => updateRows(rows.filter((_, index) => index !== rowIndex))} style={{ ...styles.button, color: '#b91c1c' }}>Remove</button></td>
        </tr>)}</tbody>
      </table>
    </div>
    <p style={{ marginTop: 8, color: 'var(--theme-elevation-600, #64748b)', fontSize: 12 }}>Copy a rectangular selection with Ctrl/Cmd+C, or paste a tab-separated block into any cell. Image cells accept an image filename or Media ID when pasted.</p>
  </div>
}
