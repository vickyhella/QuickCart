'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

type Product = Record<string, unknown> & { id: string | number }
type Media = { id: string | number; filename?: string | null; url?: string | null }
type ColumnKey =
  | 'title'
  | 'slug'
  | 'sku'
  | 'description'
  | 'price'
  | 'compareAtPrice'
  | 'category'
  | 'length'
  | 'shape'
  | 'featuredImage'
  | 'gallery'
  | 'variants'
  | 'brand'
  | 'gtin'
  | 'mpn'
  | 'googleProductCategory'
  | 'status'
  | 'isNew'
  | 'isBestSeller'

type GridRow = Record<ColumnKey, string> & { id: string }

const columns: Array<{ key: ColumnKey; label: string; width: number; multiline?: boolean }> = [
  { key: 'title', label: 'Title', width: 190 },
  { key: 'slug', label: 'Slug', width: 180 },
  { key: 'sku', label: 'SKU', width: 140 },
  { key: 'description', label: 'Description', width: 280, multiline: true },
  { key: 'price', label: 'Price', width: 100 },
  { key: 'compareAtPrice', label: 'Compare at price', width: 140 },
  { key: 'category', label: 'Category', width: 150 },
  { key: 'length', label: 'Length', width: 130 },
  { key: 'shape', label: 'Shape', width: 110 },
  { key: 'featuredImage', label: 'Featured image (Media ID or filename)', width: 245 },
  { key: 'gallery', label: 'Gallery (IDs or filenames separated by ;)', width: 270 },
  { key: 'variants', label: 'Variants (JSON)', width: 380, multiline: true },
  { key: 'brand', label: 'Brand', width: 140 },
  { key: 'gtin', label: 'GTIN', width: 140 },
  { key: 'mpn', label: 'MPN', width: 140 },
  { key: 'googleProductCategory', label: 'Google category', width: 190 },
  { key: 'status', label: 'Status (draft/published)', width: 170 },
  { key: 'isNew', label: 'New (true/false)', width: 130 },
  { key: 'isBestSeller', label: 'Best seller (true/false)', width: 160 },
]
const PAGE_SIZE = 100

const cellValue = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function mediaID(value: unknown): string {
  if (value && typeof value === 'object' && 'id' in value) return String((value as Media).id)
  return cellValue(value)
}

function toGridRow(product: Product): GridRow {
  const row = {} as GridRow
  for (const column of columns) {
    const value = product[column.key]
    if (column.key === 'featuredImage') row[column.key] = mediaID(value)
    else if (column.key === 'gallery') {
      row[column.key] = Array.isArray(value) ? value.map(mediaID).join('; ') : ''
    } else if (column.key === 'variants') {
      row[column.key] = JSON.stringify(Array.isArray(value) ? value : [], null, 2)
    } else if (column.key === 'isNew' || column.key === 'isBestSeller') {
      row[column.key] = value ? 'true' : 'false'
    } else row[column.key] = cellValue(value)
  }
  row.id = String(product.id)
  return row
}

function parseTSV(input: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let value = ''
  let quoted = false

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]
    if (char === '"') {
      if (quoted && input[i + 1] === '"') {
        value += '"'
        i += 1
      } else quoted = !quoted
    } else if (char === '\t' && !quoted) {
      row.push(value)
      value = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && input[i + 1] === '\n') i += 1
      row.push(value)
      rows.push(row)
      row = []
      value = ''
    } else value += char
  }

  row.push(value)
  if (row.some((cell) => cell.length > 0) || rows.length === 0) rows.push(row)
  return rows
}

function serializeTSV(rows: GridRow[]): string {
  const quote = (value: string) => /[\t\r\n"]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
  return [columns.map((column) => quote(column.label)).join('\t'), ...rows.map((row) =>
    columns.map((column) => quote(row[column.key])).join('\t'),
  )].join('\n')
}

function resolveMedia(value: string, media: Media[]): string | number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const match = media.find((item) => String(item.id) === trimmed || item.filename === trimmed)
  return match?.id ?? trimmed
}

function parseBoolean(value: string): boolean {
  return ['true', '1', 'yes', 'y', '✓'].includes(value.trim().toLowerCase())
}

function toPayloadData(row: GridRow, media: Media[]) {
  const variants = row.variants.trim() ? JSON.parse(row.variants) : []
  if (!Array.isArray(variants)) throw new Error('Variants must be a JSON array.')

  const gallery = row.gallery.trim()
    ? row.gallery.split(';').map((value) => resolveMedia(value, media)).filter((value) => value !== null)
    : []

  return {
    title: row.title,
    slug: row.slug,
    sku: row.sku || null,
    description: row.description,
    price: Number(row.price),
    compareAtPrice: row.compareAtPrice.trim() ? Number(row.compareAtPrice) : null,
    category: row.category,
    length: row.length || null,
    shape: row.shape || null,
    featuredImage: resolveMedia(row.featuredImage, media),
    gallery,
    variants,
    brand: row.brand || null,
    gtin: row.gtin || null,
    mpn: row.mpn || null,
    googleProductCategory: row.googleProductCategory || null,
    status: row.status,
    isNew: parseBoolean(row.isNew),
    isBestSeller: parseBoolean(row.isBestSeller),
  }
}

export function ProductBulkEditLink() {
  return (
    <div style={{ marginBlock: '1rem' }}>
      <a className="btn btn--style-primary btn--size-medium" href="/admin/collections/products/bulk-edit/">
        Open spreadsheet editor
      </a>
    </div>
  )
}

export function ProductBulkEditor() {
  const [rows, setRows] = useState<GridRow[]>([])
  const [originalRows, setOriginalRows] = useState<GridRow[]>([])
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [productsResponse, mediaResponse] = await Promise.all([
        fetch(`/api/products?limit=${PAGE_SIZE}&page=${page}&depth=1&sort=title`, { credentials: 'same-origin' }),
        fetch('/api/media?limit=1000&depth=0&sort=filename', { credentials: 'same-origin' }),
      ])
      if (!productsResponse.ok) throw new Error('Could not load products. Check that you are logged in to the admin.')
      const productsResult = await productsResponse.json()
      const mediaResult = mediaResponse.ok ? await mediaResponse.json() : { docs: [] }
      const nextRows = (productsResult.docs as Product[]).map(toGridRow)
      setRows(nextRows)
      setOriginalRows(nextRows)
      setMedia((mediaResult.docs || []) as Media[])
      setTotalPages(productsResult.totalPages || 1)
      setTotalProducts(productsResult.totalDocs || nextRows.length)
      setMessage(`Loaded page ${page} with ${nextRows.length} products.`)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load products.')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { void load() }, [load])

  const dirtyIDs = useMemo(() => {
    const originalByID = new Map(originalRows.map((row) => [row.id, row]))
    return new Set(rows.filter((row) => JSON.stringify(row) !== JSON.stringify(originalByID.get(row.id))).map((row) => row.id))
  }, [originalRows, rows])

  const visibleRows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((row) => row.title.toLowerCase().includes(needle) || row.sku.toLowerCase().includes(needle))
  }, [rows, search])

  const updateCell = (rowIndex: number, columnIndex: number, value: string) => {
    const key = columns[columnIndex].key
    setRows((current) => current.map((row, index) => index === rowIndex ? { ...row, [key]: value } : row))
    setMessage('')
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    const rowIndex = Number(target.dataset.row)
    const columnIndex = Number(target.dataset.column)
    if (!Number.isInteger(rowIndex) || !Number.isInteger(columnIndex)) return
    const matrix = parseTSV(event.clipboardData.getData('text/plain'))
    if (matrix.length === 1 && matrix[0].length === 1) return
    event.preventDefault()
    setRows((current) => current.map((row, currentRowIndex) => {
      const pastedRow = matrix[currentRowIndex - rowIndex]
      if (!pastedRow) return row
      let nextRow = row
      pastedRow.forEach((value, offset) => {
        const targetColumn = columnIndex + offset
        if (targetColumn < columns.length) nextRow = { ...nextRow, [columns[targetColumn].key]: value }
      })
      return nextRow
    }))
    setMessage(`Pasted into ${Math.min(matrix.length, rows.length - rowIndex)} product row(s). Save changes to apply them.`)
  }

  const save = async () => {
    if (dirtyIDs.size === 0) return
    setSaving(true)
    setError('')
    const failures: string[] = []
    let saved = 0
    for (const row of rows) {
      if (!dirtyIDs.has(row.id)) continue
      try {
        const data = toPayloadData(row, media)
        if (!data.title.trim() || !data.slug.trim() || !Number.isFinite(data.price) || data.price < 0) {
          throw new Error('Title, slug, and a valid non-negative price are required.')
        }
        const response = await fetch(`/api/products/${encodeURIComponent(row.id)}`, {
          method: 'PATCH',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!response.ok) {
          const result = await response.json().catch(() => ({}))
          throw new Error(result.errors?.[0]?.message || result.message || `HTTP ${response.status}`)
        }
        saved += 1
      } catch (saveError) {
        failures.push(`${row.title || row.id}: ${saveError instanceof Error ? saveError.message : 'Save failed'}`)
      }
    }
    await load()
    setSaving(false)
    if (failures.length) setError(`${saved} saved. ${failures.length} row(s) need attention: ${failures.join(' | ')}`)
    else setMessage(`Saved ${saved} product(s).`)
  }

  const exportTSV = () => {
    const blob = new Blob([serializeTSV(rows)], { type: 'text/tab-separated-values;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'products-bulk-edit.tsv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const toolbarStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBlock: '1rem' }
  // Use explicit foreground/background pairs here: Payload theme variables can
  // resolve to low-contrast combinations in custom views (for example white
  // text on a white button in light mode).
  const buttonStyle: React.CSSProperties = {
    border: '1px solid #9ca3af',
    borderRadius: 4,
    padding: '0.7rem 1rem',
    background: '#f3f4f6',
    color: '#111827',
    cursor: 'pointer',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%',
    minWidth: 90,
    minHeight: 38,
    padding: '0.45rem 0.55rem',
    border: '1px solid #9ca3af',
    borderRadius: 3,
    background: '#fff',
    color: '#111827',
    font: 'inherit',
  }

  return (
    <main style={{ padding: '2rem clamp(1rem, 3vw, 3rem)' }}>
      <a href="/admin/collections/products/" style={{ color: '#1d4ed8', textDecoration: 'underline' }}>← Products</a>
      <h1 style={{ marginBlock: '1rem 0.5rem' }}>Product spreadsheet editor</h1>
      <p style={{ maxWidth: 1000, lineHeight: 1.6 }}>
        Edit cells directly or paste a tab-separated range copied from Excel or Google Sheets. One row represents one product. Variants are a JSON array in one cell; image cells accept a Media ID or filename.
      </p>
      <p style={{ maxWidth: 1100, lineHeight: 1.6, opacity: 0.8 }}>
        Variants example: <code>[&#123;&quot;sku&quot;:&quot;GN-001-S-A&quot;,&quot;length&quot;:&quot;short&quot;,&quot;shape&quot;:&quot;almond&quot;,&quot;stock&quot;:10,&quot;trackStock&quot;:true,&quot;enabled&quot;:true&#125;]</code>. Separate multiple gallery images with semicolons. See the Media collection for filenames and IDs.
      </p>
      <div style={toolbarStyle}>
        <a href="/admin/collections/products/" style={{ ...buttonStyle, textDecoration: 'none' }}>Back to products</a>
        <button type="button" onClick={exportTSV} style={buttonStyle} disabled={loading || rows.length === 0}>Export TSV</button>
        <button type="button" onClick={() => void load()} style={buttonStyle} disabled={loading || saving}>Reload</button>
        <button type="button" onClick={() => void save()} style={{ ...buttonStyle, borderColor: '#166534', background: '#15803d', color: '#fff' }} disabled={loading || saving || dirtyIDs.size === 0}>
          {saving ? 'Saving…' : `Save ${dirtyIDs.size ? `${dirtyIDs.size} changed` : 'changes'}`}
        </button>
        <input aria-label="Search products on this page" placeholder="Filter this page by title or SKU" value={search} onChange={(event) => setSearch(event.target.value)} style={{ ...inputStyle, width: 250 }} />
        <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} style={buttonStyle} disabled={loading || saving || dirtyIDs.size > 0 || page <= 1}>Previous</button>
        <span>Page {page} of {totalPages} · {totalProducts} products total</span>
        <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} style={buttonStyle} disabled={loading || saving || dirtyIDs.size > 0 || page >= totalPages}>Next</button>
        {loading ? <span>Loading products…</span> : <span>{rows.length} on this page · {dirtyIDs.size} changed</span>}
      </div>
      {message && <p role="status" style={{ color: 'var(--theme-success-500, #16825d)' }}>{message}</p>}
      {error && <p role="alert" style={{ color: 'var(--theme-error-500, #c02b20)' }}>{error}</p>}
      {loading ? <p>Loading…</p> : rows.length === 0 ? <p>No products found.</p> : (
        <div onPaste={handlePaste} style={{ overflow: 'auto', maxHeight: '70vh', border: '1px solid var(--theme-elevation-300)' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: '100%', width: 'max-content', fontSize: 13 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--theme-elevation-100)' }}>
              <tr>
                <th style={{ padding: '0.65rem', position: 'sticky', left: 0, background: 'var(--theme-elevation-100)', zIndex: 3 }}>#</th>
                {columns.map((column) => <th key={column.key} style={{ minWidth: column.width, padding: '0.65rem', textAlign: 'left', whiteSpace: 'nowrap', borderBottom: '1px solid var(--theme-elevation-300)' }}>{column.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const rowIndex = rows.indexOf(row)
                const dirty = dirtyIDs.has(row.id)
                return (
                  <tr key={row.id} style={{ background: dirty ? 'var(--theme-elevation-50, rgba(40,120,80,.08))' : undefined }}>
                    <th style={{ position: 'sticky', left: 0, zIndex: 1, minWidth: 52, padding: '0.5rem', borderBottom: '1px solid var(--theme-elevation-150)', background: 'var(--theme-bg)' }} title={`Product ID ${row.id}`}>
                      {dirty ? '● ' : ''}{rowIndex + 1}
                    </th>
                    {columns.map((column, columnIndex) => (
                      <td key={column.key} style={{ minWidth: column.width, padding: '0.3rem', borderBottom: '1px solid var(--theme-elevation-150)', verticalAlign: 'top' }}>
                        {column.multiline ? (
                          <textarea
                            aria-label={`${column.label}, row ${rowIndex + 1}`}
                            data-row={rowIndex}
                            data-column={columnIndex}
                            rows={column.key === 'variants' ? 5 : 3}
                            value={row[column.key]}
                            onChange={(event) => updateCell(rowIndex, columnIndex, event.target.value)}
                            style={{ ...inputStyle, minWidth: column.width, resize: 'vertical', fontFamily: column.key === 'variants' ? 'monospace' : 'inherit' }}
                          />
                        ) : (
                          <>
                            <input
                              aria-label={`${column.label}, row ${rowIndex + 1}`}
                              data-row={rowIndex}
                              data-column={columnIndex}
                              list={column.key === 'featuredImage' ? 'product-media-options' : undefined}
                              value={row[column.key]}
                              onChange={(event) => updateCell(rowIndex, columnIndex, event.target.value)}
                              style={inputStyle}
                            />
                            {column.key === 'featuredImage' && (() => {
                              const selectedMedia = media.find((item) => String(item.id) === row.featuredImage || item.filename === row.featuredImage)
                              return selectedMedia?.url ? <img src={selectedMedia.url} alt={selectedMedia.filename || 'Selected product image'} style={{ display: 'block', marginTop: 6, maxWidth: 110, maxHeight: 80, objectFit: 'contain' }} /> : null
                            })()}
                          </>
                        )}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
          <datalist id="product-media-options">
            {media.map((item) => item.filename ? <option key={item.id} value={item.filename}>{item.filename} (ID {item.id})</option> : null)}
          </datalist>
        </div>
      )}
    </main>
  )
}
