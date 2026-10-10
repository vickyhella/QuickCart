'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

type Product = Record<string, unknown> & { id: string | number }
type Media = { id: string | number; filename?: string | null; url?: string | null }
type ProductVariant = {
  id?: string
  sku: string
  length: string
  shape: string
  size: string
  price?: number | null
  compareAtPrice?: number | null
  gtin?: string
  mpn?: string
  image?: string | number | Media | null
  stock: number
  trackStock: boolean
  enabled: boolean
}
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
  | 'material'
  | 'color'
  | 'gender'
  | 'ageGroup'
  | 'condition'
  | 'adult'
  | 'multipack'
  | 'gtin'
  | 'mpn'
  | 'googleProductCategory'
  | 'status'
  | 'isNew'
  | 'isBestSeller'
  | 'seoTitle'
  | 'seoDescription'

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
  { key: 'material', label: 'Material', width: 150 },
  { key: 'color', label: 'Color', width: 130 },
  { key: 'gender', label: 'Gender', width: 100 },
  { key: 'ageGroup', label: 'Age group', width: 120 },
  { key: 'condition', label: 'Condition', width: 120 },
  { key: 'adult', label: 'Adult (true/false)', width: 130 },
  { key: 'multipack', label: 'Multipack', width: 100 },
  { key: 'gtin', label: 'GTIN', width: 140 },
  { key: 'mpn', label: 'MPN', width: 140 },
  { key: 'googleProductCategory', label: 'Google category', width: 190 },
  { key: 'seoTitle', label: 'SEO title', width: 200 },
  { key: 'seoDescription', label: 'SEO description', width: 260, multiline: true },
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
    } else if (column.key === 'isNew' || column.key === 'isBestSeller' || column.key === 'adult') {
      row[column.key] = value ? 'true' : 'false'
    } else if (column.key === 'material') {
      row[column.key] = cellValue(value) || 'ABS Plastic'
    } else if (column.key === 'gender') {
      row[column.key] = cellValue(value) || 'unisex'
    } else if (column.key === 'ageGroup') {
      row[column.key] = cellValue(value) || 'adult'
    } else if (column.key === 'condition') {
      row[column.key] = cellValue(value) || 'new'
    } else if (column.key === 'googleProductCategory') {
      row[column.key] = cellValue(value) || 'Health & Beauty > Personal Care > Cosmetics > Nail Care > False Nails'
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

function getVariantSKU(row: GridRow, shape: string, length: string, size: string, shapeValues: string[], lengthValues: string[]) {
  const productCode = /^\d{4}$/.test(row.sku) ? row.sku : String(row.id).replace(/\D/g, '').padStart(4, '0').slice(-4)
  const lengthCodes: Record<string, string> = { 'x-short': '01', short: '02', medium: '03', long: '04', 'x-long': '05' }
  const shapeCodes: Record<string, string> = { square: '01', oval: '02', almond: '03', round: '04' }
  const customCode = (value: string, known: Record<string, string>, values: string[]) => known[value] || String(50 + [...new Set(values.filter((item) => !known[item]))].sort().indexOf(value)).padStart(2, '0')
  const sizeCode: Record<string, string> = { xs: '01', s: '02', m: '03', l: '04' }
  return `${productCode}-${customCode(length, lengthCodes, lengthValues)}-${customCode(shape, shapeCodes, shapeValues)}-${sizeCode[size] || '02'}`
}

function toPayloadData(row: GridRow, media: Media[]) {
  const parsedVariants = row.variants.trim() ? JSON.parse(row.variants) : []
  if (!Array.isArray(parsedVariants)) throw new Error('Variants must be a JSON array.')
  const variants = parsedVariants.map((variant) => ({ ...variant, size: variant.size || 's', image: resolveMedia(mediaID(variant.image), media) }))

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
    material: row.material || 'ABS Plastic',
    color: row.color || null,
    gender: row.gender || 'unisex',
    ageGroup: row.ageGroup || 'adult',
    condition: row.condition || 'new',
    adult: parseBoolean(row.adult),
    multipack: row.multipack.trim() ? Number(row.multipack) : null,
    gtin: row.gtin || null,
    mpn: row.mpn || null,
    googleProductCategory: row.googleProductCategory || 'Health & Beauty > Personal Care > Cosmetics > Nail Care > False Nails',
    seoTitle: row.seoTitle || null,
    seoDescription: row.seoDescription || null,
    status: row.status,
    isNew: parseBoolean(row.isNew),
    isBestSeller: parseBoolean(row.isBestSeller),
  }
}

export function ProductBulkEditLink() {
  return (
    <div style={{ marginBlock: '1rem', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      <a className="btn btn--style-primary btn--size-medium" href="/admin/collections/products/bulk-edit/">
        Open spreadsheet editor
      </a>
      <a className="btn btn--style-secondary btn--size-medium" href="/merchant-feed" target="_blank" rel="noreferrer">
        Preview Merchant Center feed
      </a>
    </div>
  )
}

export function EditVariantsInSpreadsheetButton() {
  const [href, setHref] = useState('')
  useEffect(() => {
    const productId = window.location.pathname.match(/\/admin\/collections\/products\/([^/]+)/)?.[1]
    if (productId && productId !== 'create') setHref(`/admin/collections/products/bulk-edit/?product=${encodeURIComponent(productId)}`)
  }, [])
  return href ? <a className="btn btn--style-secondary btn--size-medium" href={href}>Edit variants in spreadsheet</a> : null
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
  const [variantEditor, setVariantEditor] = useState<{ rowIndex: number; variants: ProductVariant[]; values: { shape: string[]; length: string[]; size: string[] } } | null>(null)
  const [selectedRange, setSelectedRange] = useState<{ startRow: number; startColumn: number; endRow: number; endColumn: number } | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const productOnly = new URLSearchParams(window.location.search).get('product')
      const [productsResponse, mediaResponse] = await Promise.all([
        fetch(productOnly ? `/api/products/${encodeURIComponent(productOnly)}?depth=1` : `/api/products?limit=${PAGE_SIZE}&page=${page}&depth=1&sort=title`, { credentials: 'same-origin' }),
        fetch('/api/media?limit=1000&depth=0&sort=filename', { credentials: 'same-origin' }),
      ])
      if (!productsResponse.ok) throw new Error('Could not load products. Check that you are logged in to the admin.')
      const productsResult = await productsResponse.json()
      const mediaResult = mediaResponse.ok ? await mediaResponse.json() : { docs: [] }
      const productDocs = productOnly ? (productsResult?.id ? [productsResult] : []) : (productsResult.docs || [])
      const nextRows = (productDocs as Product[]).map(toGridRow)
      setRows(nextRows)
      setOriginalRows(nextRows)
      setMedia((mediaResult.docs || []) as Media[])
      setTotalPages(productOnly ? 1 : productsResult.totalPages || 1)
      setTotalProducts(productOnly ? nextRows.length : productsResult.totalDocs || nextRows.length)
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

  const uploadMedia = async (file: File) => {
    const body = new FormData()
    body.append('file', file)
    const response = await fetch('/api/media', { method: 'POST', credentials: 'same-origin', body })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(result.errors?.[0]?.message || result.message || 'Image upload failed')
    const uploaded = result.doc as Media
    setMedia((current) => [uploaded, ...current.filter((item) => String(item.id) !== String(uploaded.id))])
    return uploaded
  }

  const openVariantEditor = (rowIndex: number) => {
    try {
      const parsed = rows[rowIndex].variants.trim() ? JSON.parse(rows[rowIndex].variants) : []
      if (!Array.isArray(parsed)) throw new Error('Variants must be a JSON array.')
      const variants = parsed.map((variant) => ({
        ...variant,
        sku: variant.sku || '',
        length: variant.length || 'short',
        shape: variant.shape || 'almond',
        size: variant.size || 's',
        price: variant.price ?? Number(rows[rowIndex].price || 0),
        compareAtPrice: variant.compareAtPrice ?? (rows[rowIndex].compareAtPrice ? Number(rows[rowIndex].compareAtPrice) : null),
        image: (() => { const imageID = mediaID(variant.image || rows[rowIndex].featuredImage); return media.find((item) => String(item.id) === imageID)?.filename || imageID })(),
        stock: Number(variant.stock ?? 10),
        trackStock: Boolean(variant.trackStock ?? true),
        enabled: variant.enabled !== false,
      }))
      setVariantEditor({ rowIndex, variants, values: {
        shape: [...new Set(variants.map((variant) => variant.shape))].length ? [...new Set(variants.map((variant) => variant.shape))] : ['almond'],
        length: [...new Set(variants.map((variant) => variant.length))].length ? [...new Set(variants.map((variant) => variant.length))] : ['short'],
        size: [...new Set(variants.map((variant) => variant.size))].length ? [...new Set(variants.map((variant) => variant.size))].sort((a, b) => ['xs', 's', 'm', 'l'].indexOf(a) - ['xs', 's', 'm', 'l'].indexOf(b)) : ['xs', 's', 'm'],
      } })
      setError('')
    } catch (variantError) {
      setError(`Cannot open variants for ${rows[rowIndex].title}: ${variantError instanceof Error ? variantError.message : 'Invalid JSON'}`)
    }
  }

  const applyVariantEditor = () => {
    if (!variantEditor) return
    updateCell(variantEditor.rowIndex, columns.findIndex((column) => column.key === 'variants'), JSON.stringify(variantEditor.variants, null, 2))
    setVariantEditor(null)
  }

  const syncVariantCombinations = () => {
    if (!variantEditor) return
    const existing = new Map(variantEditor.variants.map((variant) => [`${variant.shape}|${variant.length}|${variant.size}`, variant]))
    const next: ProductVariant[] = []
    for (const shape of variantEditor.values.shape) for (const length of variantEditor.values.length) for (const size of variantEditor.values.size) {
      const key = `${shape}|${length}|${size}`
      next.push(existing.get(key) || {
        sku: getVariantSKU(rows[variantEditor.rowIndex], shape, length, size, variantEditor.values.shape, variantEditor.values.length),
        shape, length, size,
        price: Number(rows[variantEditor.rowIndex]?.price || 0),
        compareAtPrice: rows[variantEditor.rowIndex]?.compareAtPrice ? Number(rows[variantEditor.rowIndex].compareAtPrice) : null,
        image: mediaID(rows[variantEditor.rowIndex]?.featuredImage) || null,
        stock: 10, trackStock: true, enabled: true,
      })
    }
    setVariantEditor({ ...variantEditor, variants: next })
  }

  const handleVariantPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    const startRow = Number(target.dataset.variantRow)
    const startColumn = Number(target.dataset.variantColumn)
    if (!variantEditor || !Number.isInteger(startRow) || !Number.isInteger(startColumn)) return
    const matrix = parseTSV(event.clipboardData.getData('text/plain'))
    event.preventDefault()
    const keys: Array<keyof ProductVariant> = ['sku', 'length', 'shape', 'size', 'price', 'compareAtPrice', 'stock', 'image', 'trackStock', 'enabled']
    setVariantEditor((current) => {
      if (!current) return current
      const variants = [...current.variants]
      matrix.forEach((values, rowOffset) => values.forEach((value, columnOffset) => {
        const rowIndex = startRow + rowOffset
        const key = keys[startColumn + columnOffset]
        if (!key) return
        while (variants.length <= rowIndex) variants.push({ sku: '', length: 'short', shape: 'almond', size: 's', stock: 0, trackStock: false, enabled: true })
        const variant = { ...variants[rowIndex] }
        if (key === 'price' || key === 'compareAtPrice') variant[key] = value.trim() ? Number(value) : null
        else if (key === 'stock') variant.stock = Number(value || 0)
        else if (key === 'trackStock' || key === 'enabled') variant[key] = parseBoolean(value)
        else if (key === 'image') variant.image = resolveMedia(value, media)
        else variant[key] = value as never
        variants[rowIndex] = variant
      }))
      return { ...current, variants }
    })
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

  const handleCopy = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLTextAreaElement
    if (target instanceof HTMLTextAreaElement && target.selectionStart !== target.selectionEnd) return
    if (!selectedRange) return
    const top = Math.min(selectedRange.startRow, selectedRange.endRow)
    const bottom = Math.max(selectedRange.startRow, selectedRange.endRow)
    const left = Math.min(selectedRange.startColumn, selectedRange.endColumn)
    const right = Math.max(selectedRange.startColumn, selectedRange.endColumn)
    const quote = (value: string) => /[\t\r\n"]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
    const tsv = rows.slice(top, bottom + 1).map((row) => columns.slice(left, right + 1).map(({ key }) => quote(row[key])).join('\t')).join('\n')
    event.preventDefault()
    event.clipboardData.setData('text/plain', tsv)
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
        Edit cells directly or paste a tab-separated range copied from Excel or Google Sheets. One row represents one product. Use “Edit variants” for a readable variant table; image cells accept a Media ID or filename.
      </p>
      <p style={{ maxWidth: 1100, lineHeight: 1.6, opacity: 0.8 }}>
        Variants can be edited in a table per product. Separate multiple gallery images with semicolons. See the Media collection for filenames and IDs.
      </p>
      <div style={toolbarStyle}>
        <a href="/admin/collections/products/" style={{ ...buttonStyle, textDecoration: 'none' }}>Back to products</a>
        <a href="/merchant-feed" target="_blank" rel="noreferrer" style={{ ...buttonStyle, textDecoration: 'none' }}>Preview Merchant Center feed</a>
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
        <div onPasteCapture={handlePaste} onCopy={handleCopy} onMouseUp={() => setIsSelecting(false)} style={{ overflow: 'auto', maxHeight: '70vh', border: '1px solid var(--theme-elevation-300)' }}>
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
                      <td key={column.key}
                        onMouseDown={(event) => { if ((event.target as HTMLElement).closest('button, input[type=file]')) return; setSelectedRange((current) => event.shiftKey && current ? { ...current, endRow: rowIndex, endColumn: columnIndex } : { startRow: rowIndex, startColumn: columnIndex, endRow: rowIndex, endColumn: columnIndex }); setIsSelecting(true) }}
                        onMouseEnter={() => { if (isSelecting) setSelectedRange((current) => current ? { ...current, endRow: rowIndex, endColumn: columnIndex } : current) }}
                        style={{ minWidth: column.width, padding: '0.3rem', borderBottom: '1px solid var(--theme-elevation-150)', verticalAlign: 'top', color: '#111827', background: selectedRange && rowIndex >= Math.min(selectedRange.startRow, selectedRange.endRow) && rowIndex <= Math.max(selectedRange.startRow, selectedRange.endRow) && columnIndex >= Math.min(selectedRange.startColumn, selectedRange.endColumn) && columnIndex <= Math.max(selectedRange.startColumn, selectedRange.endColumn) ? '#bfdbfe' : undefined }}>
                        {column.key === 'gallery' ? (
                          <>
                            <select data-row={rowIndex} data-column={columnIndex} multiple aria-label={`Gallery images for ${row.title}`} value={row.gallery.split(';').map((value) => value.trim()).filter(Boolean).map((value) => media.find((item) => String(item.id) === value || item.filename === value)?.id.toString() || value)} onChange={(event) => updateCell(rowIndex, columnIndex, [...event.currentTarget.selectedOptions].map((option) => option.value).join('; '))} style={{ ...inputStyle, minHeight: 96, color: '#111827' }}>
                              {media.map((item) => <option key={item.id} value={String(item.id)}>{item.filename || `Media ${item.id}`}</option>)}
                            </select>
                            <p style={{ margin: '3px 0', fontSize: 11, color: '#4b5563' }}>Ctrl/Cmd-click to select multiple</p>
                            <input type="file" accept="image/*" multiple aria-label={`Upload gallery images for ${row.title}`} onChange={async (event) => { const input = event.currentTarget; const files = [...(input.files || [])]; if (!files.length) return; try { const uploaded = await Promise.all(files.map(uploadMedia)); const current = rows[rowIndex].gallery.split(';').map((value) => value.trim()).filter(Boolean); updateCell(rowIndex, columnIndex, [...new Set([...current, ...uploaded.map((item) => String(item.id))])].join('; ')) } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : 'Image upload failed') } input.value = '' }} style={{ display: 'block', width: column.width, fontSize: 11 }} />
                          </>
                        ) : column.key === 'variants' ? (
          <div>
                            <button type="button" onClick={() => openVariantEditor(rowIndex)} style={{ ...buttonStyle, whiteSpace: 'nowrap' }}>
                              Edit variants ({(() => { try { const v = JSON.parse(row.variants || '[]'); return Array.isArray(v) ? v.length : '?' } catch { return '!' } })()})
                            </button>
                            <div style={{ marginTop: 5, color: '#4b5563', fontSize: 12 }}>Structured editor</div>
                          </div>
                        ) : column.multiline ? (
                          column.key === 'description' ? <>
                          <textarea
                            aria-label={`${column.label}, row ${rowIndex + 1}`}
                            data-row={rowIndex}
                            data-column={columnIndex}
                            rows={3}
                            value={row[column.key]}
                            onChange={(event) => updateCell(rowIndex, columnIndex, event.target.value)}
                            style={{ ...inputStyle, minWidth: column.width, resize: 'vertical' }}
                          />
                          <label style={{ display: 'block', marginTop: 5, fontSize: 12 }}>Insert uploaded image into Markdown
                            <input type="file" accept="image/*" onChange={async (event) => { const input = event.currentTarget; const file = input.files?.[0]; if (!file) return; try { const uploaded = await uploadMedia(file); if (!uploaded.url) throw new Error('Uploaded image URL is missing'); updateCell(rowIndex, columnIndex, `${row.description}${row.description ? '\n\n' : ''}![${uploaded.filename || 'Product image'}](${uploaded.url})`) } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : 'Image upload failed') } input.value = '' }} style={{ display: 'block', maxWidth: column.width, fontSize: 11 }} />
                          </label>
                          </> : <textarea
                            aria-label={`${column.label}, row ${rowIndex + 1}`}
                            data-row={rowIndex}
                            data-column={columnIndex}
                            rows={3}
                            value={row[column.key]}
                            onChange={(event) => updateCell(rowIndex, columnIndex, event.target.value)}
                            style={{ ...inputStyle, minWidth: column.width, resize: 'vertical' }}
                          />
                        ) : (
                          <>
                            <input
                              aria-label={`${column.label}, row ${rowIndex + 1}`}
                              data-row={rowIndex}
                              data-column={columnIndex}
                              list={column.key === 'featuredImage' ? 'product-media-options' : column.key === 'googleProductCategory' ? 'google-category-options' : undefined}
                              value={row[column.key]}
                              onChange={(event) => updateCell(rowIndex, columnIndex, event.target.value)}
                              style={inputStyle}
                            />
                            {column.key === 'featuredImage' && (() => {
                              const selectedMedia = media.find((item) => String(item.id) === row.featuredImage || item.filename === row.featuredImage)
                              return <>
                                {selectedMedia?.url && <img src={selectedMedia.url} alt={selectedMedia.filename || 'Selected product image'} style={{ display: 'block', marginTop: 6, maxWidth: 110, maxHeight: 80, objectFit: 'contain' }} />}
                                <label style={{ display: 'block', marginTop: 5, fontSize: 12 }}>Upload
                                  <input type="file" accept="image/*" aria-label={`Upload image for ${row.title}`} onChange={async (event) => { const input = event.currentTarget; const file = input.files?.[0]; if (!file) return; try { const uploaded = await uploadMedia(file); updateCell(rowIndex, columnIndex, String(uploaded.id)) } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : 'Image upload failed') } input.value = '' }} style={{ display: 'block', maxWidth: column.width, fontSize: 11 }} />
                                </label>
                              </>
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
          <datalist id="google-category-options">
            {['Health & Beauty > Personal Care > Cosmetics > Nail Care > False Nails', 'Health & Beauty > Personal Care > Cosmetics > Nail Care', 'Health & Beauty > Personal Care > Cosmetics > Nail Care > Nail Polish', 'Health & Beauty > Personal Care > Cosmetics'].map((category) => <option key={category} value={category} />)}
          </datalist>
        </div>
      )}
      {variantEditor && (
        <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setVariantEditor(null) }} style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(15, 23, 42, 0.58)' }}>
          <section role="dialog" aria-modal="true" aria-labelledby="variant-editor-title" style={{ width: 'min(1200px, 96vw)', maxHeight: '90vh', overflow: 'auto', background: '#fff', color: '#111827', borderRadius: 8, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
            <h2 id="variant-editor-title" style={{ marginTop: 0 }}>Variants — {rows[variantEditor.rowIndex]?.title}</h2>
            <p style={{ color: '#4b5563' }}>Choose the available options in all three dimensions, then sync combinations. Existing SKU, price, stock and image values are kept for matching combinations. You can paste a tab-separated block from a spreadsheet into the first cell; columns follow the table order.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(180px, 1fr))', gap: 16, marginBlock: 16 }}>
              {([
                ['shape', ['square', 'oval', 'almond', 'round']],
                ['length', ['x-short', 'short', 'medium', 'long', 'x-long']],
                ['size', ['xs', 's', 'm', 'l']],
              ] as const).map(([dimension, defaults]) => {
                const options = [...new Set([...defaults, ...variantEditor.values[dimension]])]
                return <fieldset key={dimension} style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: 12 }}>
                <legend style={{ paddingInline: 5, fontWeight: 600, textTransform: 'capitalize' }}>{dimension}</legend>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>{options.map((option) => <label key={option} style={{ display: 'inline-flex', gap: 5, alignItems: 'center', textTransform: 'capitalize' }}><input type="checkbox" checked={variantEditor.values[dimension].includes(option)} onChange={(event) => setVariantEditor((current) => current ? { ...current, values: { ...current.values, [dimension]: event.target.checked ? [...current.values[dimension], option] : current.values[dimension].filter((value) => value !== option) } } : current)} />{option.replace('-', ' ')}</label>)}</div>
                {dimension !== 'size' && <input aria-label={`Add ${dimension} option`} placeholder={`Add ${dimension}, press Enter`} onKeyDown={(event) => { if (event.key !== 'Enter') return; event.preventDefault(); const value = event.currentTarget.value.trim().toLowerCase().replace(/\s+/g, '-'); if (!value) return; setVariantEditor((current) => current ? { ...current, values: { ...current.values, [dimension]: [...new Set([...current.values[dimension], value])] } } : current); event.currentTarget.value = '' }} style={{ ...inputStyle, marginTop: 10, maxWidth: 260 }} />}
              </fieldset>
              })}
            </div>
            <button type="button" onClick={syncVariantCombinations} style={{ ...buttonStyle, marginBottom: 12 }}>Sync combinations &amp; generate SKUs</button>
            <div style={{ overflowX: 'auto' }}>
              <div onPaste={handleVariantPaste}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200 }}>
                <thead><tr>{['SKU', 'Length', 'Shape', 'Size', 'Price', 'Compare at', 'Stock', 'Variant image', 'Track stock', 'Enabled', ''].map((label) => <th key={label} style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #d1d5db', whiteSpace: 'nowrap' }}>{label}</th>)}</tr></thead>
                <tbody>{variantEditor.variants.map((variant, index) => {
                  const edit = (key: keyof ProductVariant, value: string | number | boolean | null) => setVariantEditor((current) => current ? { ...current, variants: current.variants.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) } : current)
                  const cellInput: React.CSSProperties = { ...inputStyle, minWidth: 90 }
                  const variantMedia = media.find((item) => String(item.id) === String(typeof variant.image === 'object' ? variant.image?.id || '' : variant.image || '') || item.filename === variant.image)
                  return <tr key={variant.id || index}>
                    <td style={{ padding: 5 }}><input data-variant-row={index} data-variant-column={0} aria-label={`Variant ${index + 1} SKU`} value={variant.sku} onChange={(event) => edit('sku', event.target.value)} style={cellInput} /></td>
                    <td style={{ padding: 5 }}><input data-variant-row={index} data-variant-column={1} aria-label={`Variant ${index + 1} length`} placeholder="Length" value={variant.length} onChange={(event) => edit('length', event.target.value)} style={cellInput} /></td>
                    <td style={{ padding: 5 }}><input data-variant-row={index} data-variant-column={2} aria-label={`Variant ${index + 1} shape`} placeholder="Shape" value={variant.shape} onChange={(event) => edit('shape', event.target.value)} style={cellInput} /></td>
                    <td style={{ padding: 5 }}><select data-variant-row={index} data-variant-column={3} aria-label={`Variant ${index + 1} size`} value={variant.size} onChange={(event) => edit('size', event.target.value)} style={cellInput}>{['xs','s','m','l'].map((value) => <option key={value} value={value}>{value.toUpperCase()}</option>)}</select></td>
                    <td style={{ padding: 5 }}><input data-variant-row={index} data-variant-column={4} aria-label={`Variant ${index + 1} price`} type="number" min="0" value={variant.price ?? ''} onChange={(event) => edit('price', event.target.value === '' ? null : Number(event.target.value))} style={cellInput} /></td>
                    <td style={{ padding: 5 }}><input data-variant-row={index} data-variant-column={5} aria-label={`Variant ${index + 1} compare at price`} type="number" min="0" value={variant.compareAtPrice ?? ''} onChange={(event) => edit('compareAtPrice', event.target.value === '' ? null : Number(event.target.value))} style={cellInput} /></td>
                    <td style={{ padding: 5 }}><input data-variant-row={index} data-variant-column={6} aria-label={`Variant ${index + 1} stock`} type="number" min="0" value={variant.stock} onChange={(event) => edit('stock', Number(event.target.value))} style={cellInput} /></td>
                    <td style={{ padding: 5 }}><input data-variant-row={index} data-variant-column={7} aria-label={`Variant ${index + 1} image filename or media ID`} list="product-media-options" placeholder="Product image" value={typeof variant.image === 'object' ? String(variant.image?.id || '') : String(variant.image || '')} onChange={(event) => edit('image', event.target.value)} style={{ ...cellInput, minWidth: 190 }} />{variantMedia?.url && <img src={variantMedia.url} alt={variantMedia.filename || `Variant ${index + 1} image`} style={{ display: 'block', marginTop: 4, maxWidth: 52, maxHeight: 52, objectFit: 'cover' }} />}<label style={{ display: 'block', fontSize: 11, marginTop: 4 }}>Upload<input type="file" accept="image/*" aria-label={`Upload image for variant ${index + 1}`} onChange={async (event) => { const input = event.currentTarget; const file = input.files?.[0]; if (!file) return; try { const uploaded = await uploadMedia(file); edit('image', uploaded.id) } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : 'Image upload failed') } input.value = '' }} style={{ display: 'block', maxWidth: 180, fontSize: 10 }} /></label></td>
                    <td style={{ padding: 5, textAlign: 'center' }}><input data-variant-row={index} data-variant-column={8} aria-label={`Variant ${index + 1} track stock`} type="checkbox" checked={variant.trackStock} onChange={(event) => edit('trackStock', event.target.checked)} /></td>
                    <td style={{ padding: 5, textAlign: 'center' }}><input data-variant-row={index} data-variant-column={9} aria-label={`Variant ${index + 1} enabled`} type="checkbox" checked={variant.enabled} onChange={(event) => edit('enabled', event.target.checked)} /></td>
                    <td style={{ padding: 5 }}><button type="button" onClick={() => setVariantEditor((current) => current ? { ...current, variants: current.variants.filter((_, itemIndex) => itemIndex !== index) } : current)} style={{ ...buttonStyle, color: '#991b1b' }}>Remove</button></td>
                  </tr>
                })}</tbody>
              </table>
              </div>
            </div>
            <div style={{ ...toolbarStyle, justifyContent: 'space-between' }}>
              <button type="button" onClick={() => setVariantEditor((current) => current ? { ...current, variants: [...current.variants, { sku: '', length: 'short', shape: 'almond', size: 's', price: Number(rows[current.rowIndex]?.price || 0), compareAtPrice: rows[current.rowIndex]?.compareAtPrice ? Number(rows[current.rowIndex].compareAtPrice) : null, image: mediaID(rows[current.rowIndex]?.featuredImage) || null, stock: 10, trackStock: true, enabled: true }] } : current)} style={buttonStyle}>+ Add variant</button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setVariantEditor(null)} style={buttonStyle}>Cancel</button>
                <button type="button" onClick={applyVariantEditor} style={{ ...buttonStyle, borderColor: '#166534', background: '#15803d', color: '#fff' }}>Apply variants</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
