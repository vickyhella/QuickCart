'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { readJSONResponse } from '@/lib/read-json-response'
import { defaultProductDimensionOptions } from '@/lib/product-dimensions'
import { ProductWorkspaceTabs } from './ProductWorkspaceTabs'

type CategoryOption = {
  value: string | number
  label: string
  image?: { id: string | number; url?: string } | string | number | null
  products: { id: string | number; title: string; status: string }[]
}
type Dimension = { key: string; label: string; valueType: 'text' | 'integer'; options: CategoryOption[] }
type CategoryResponse = { dimensions: Dimension[]; media?: { id: string | number; filename: string; url?: string }[] }

const initialDimensions: Dimension[] = [
  ...([
    ['lengths', 'Length', defaultProductDimensionOptions.lengths],
    ['shapes', 'Shape', defaultProductDimensionOptions.shapes],
  ] as const).map(([key, label, options]) => ({ key, label, valueType: 'text' as const, options: options.map((option) => ({ ...option, products: [] })) })),
  { key: 'color', label: 'Color', valueType: 'text', options: [] },
  { key: 'quantity', label: 'Quantity', valueType: 'integer', options: [] },
]

export function ProductCategoriesView() {
  const [dimension, setDimension] = useState('lengths')
  const [dimensions, setDimensions] = useState<CategoryResponse['dimensions']>(initialDimensions)
  const [media, setMedia] = useState<CategoryResponse['media']>([])
  const [label, setLabel] = useState('')
  const [newDimension, setNewDimension] = useState('')
  const [newDimensionType, setNewDimensionType] = useState<'text' | 'integer'>('text')
  const [editingValue, setEditingValue] = useState('')
  const [expandedValue, setExpandedValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    fetch('/api/studio/categories', { cache: 'no-store' })
      .then(
        (response) => readJSONResponse(response) as Promise<CategoryResponse>,
      )
      .then((data) => {
        if (active) { setDimensions(data.dimensions); setMedia(data.media || []) }
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : 'Could not load categories.',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const save = async (
    action: 'add' | 'rename' | 'delete',
    value: string,
    nextLabel?: string,
  ) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/studio/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, dimension, value, label: nextLabel }),
      })
      const data = (await readJSONResponse(response)) as CategoryResponse
      setDimensions(data.dimensions)
      setMedia(data.media || [])
      setLabel('')
      setEditingValue('')
      setNotice(
        action === 'add'
          ? 'Category added.'
          : action === 'rename'
            ? 'Display name updated.'
            : 'Unused category deleted.',
      )
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not update category.',
      )
    } finally {
      setBusy(false)
    }
  }

  const saveImage = async (value: string, image: string) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/studio/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'set-image', dimension, value, image: image || null }) })
      const data = await readJSONResponse(response) as CategoryResponse
      setDimensions(data.dimensions)
      setMedia(data.media || [])
      setNotice('Preview image saved.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save preview image.')
    } finally { setBusy(false) }
  }

  const add = () => {
    const nextLabel = label.trim()
    if (currentDimension?.valueType === 'integer' && (!/^\d+$/.test(nextLabel) || Number(nextLabel) < 1)) {
      setError('Enter a positive whole number.')
      return
    }
    const value = dimension === 'color' ? nextLabel : nextLabel
      .toLocaleLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{N}-]+/gu, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    if (!nextLabel || !value) {
      setError('Enter a category name using letters or numbers.')
      return
    }
    void save('add', currentDimension?.valueType === 'integer' ? String(Number(nextLabel)) : value, nextLabel)
  }

  const addDimension = async () => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/studio/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-dimension', label: newDimension.trim(), valueType: newDimensionType }),
      })
      const data = await readJSONResponse(response) as CategoryResponse
      setDimensions(data.dimensions)
      const added = data.dimensions.find((item) => item.label.toLowerCase() === newDimension.trim().toLowerCase())
      if (added) setDimension(added.key)
      setNewDimension('')
      setNewDimensionType('text')
      setNotice('Dimension added.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not add dimension.')
    } finally {
      setBusy(false)
    }
  }

  const currentDimension = dimensions.find((item) => item.key === dimension) || dimensions[0]
  const currentOptions = currentDimension?.options || []

  return (
    <main className="product-studio mx-auto min-h-screen max-w-[1600px] bg-[#f7f3f0] px-5 py-10 font-sans text-base antialiased text-[#302522] sm:px-8 lg:px-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Categories</h1>
          <p className="mt-2 text-sm text-[#766966]">
            Manage variant dimensions and product-level filter categories.
          </p>
        </div>
      </header>

      <ProductWorkspaceTabs />

      <form
        className="mb-5 flex flex-wrap items-end gap-3"
        onSubmit={(event) => { event.preventDefault(); void addDimension() }}
      >
        <label className="min-w-56 flex-1 text-sm text-[#766762]">
          Add a dimension
          <input
            className="mt-1 block w-full rounded-xl border border-[#e7ddd8] bg-white px-4 py-3 text-sm text-[#302522]"
            value={newDimension}
            onChange={(event) => setNewDimension(event.target.value)}
            placeholder="e.g. Quantity"
            disabled={busy}
          />
        </label>
        <label className="text-sm text-[#766762]">Value type
          <select className="mt-1 block rounded-xl border border-[#e7ddd8] bg-white px-4 py-3 text-sm text-[#302522]" value={newDimensionType} onChange={(event) => setNewDimensionType(event.target.value as 'text' | 'integer')} disabled={busy}>
            <option value="text">Text</option><option value="integer">Integer</option>
          </select>
        </label>
        <button type="submit" disabled={busy || !newDimension.trim()} className="ui-button ui-button--primary">
          Add dimension
        </button>
      </form>

      <div
        role="tablist"
        aria-label="Product dimensions"
        className="mb-6 flex gap-2 border-b border-[#e7ddd8]"
      >
        {dimensions.map(({ key, label: title }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={dimension === key}
            onClick={() => {
              setDimension(key)
              setEditingValue('')
              setLabel('')
              setExpandedValue('')
            }}
            className="border-0 border-b-2 bg-transparent px-4 py-3 text-sm"
            style={{
              borderBottomColor:
                dimension === key ? 'var(--accent)' : 'transparent',
              color:
                dimension === key
                  ? 'var(--brand-text-primary)'
                  : 'var(--brand-text-secondary)',
              fontWeight: dimension === key ? 600 : 400,
            }}
          >
            {title}
          </button>
        ))}
      </div>

      {error && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}

      <section className="overflow-hidden rounded-2xl border border-[#eee5e0] bg-white shadow-[0_8px_30px_rgba(74,50,42,0.035)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f0e9e5] px-5 py-5 sm:px-7">
          <div>
            <h2 className="font-serif text-xl">
              {currentDimension?.label} {currentDimension?.valueType === 'integer' ? 'values in use' : 'options'}
            </h2>
            <p className="mt-1 text-sm text-[#968680]">
              {currentDimension?.valueType === 'integer'
                ? 'Enter integer values directly on each product variant. The values below are collected from products.'
                : currentDimension?.key === 'color'
                  ? 'Assign one color to each product in Product Studio. Color is used for filtering and is not a variant choice.'
                  : 'Display names can change without changing values stored in product variants.'}
            </p>
          </div>
          <span className="rounded-full border border-[#e7ddd8] bg-white px-3 py-2 text-sm text-[#806e68]">
            {currentOptions.length} {currentDimension?.valueType === 'integer' ? 'values' : 'categories'}
          </span>
        </div>

        {currentDimension?.valueType !== 'integer' && <form
          className="flex flex-wrap items-end gap-3 border-b border-[#f0e9e5] bg-[#fcfaf9] px-5 py-4 sm:px-7"
          onSubmit={(event) => {
            event.preventDefault()
            add()
          }}
        >
          <label className="min-w-56 flex-1 text-sm text-[#766762]">
            New category name
            <input
              className="mt-1 block w-full rounded-xl border border-[#e7ddd8] bg-white px-4 py-3 text-sm text-[#302522]"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder={dimension === 'lengths' ? 'e.g. XX-Long' : dimension === 'shapes' ? 'e.g. Coffin' : dimension === 'color' ? 'e.g. Nude Pink' : 'e.g. Glossy'}
              type="text"
              disabled={busy}
            />
          </label>
          <button
            type="submit"
            disabled={busy || !label.trim()}
            className="ui-button ui-button--primary"
          >
            Add category
          </button>
        </form>}

        {loading ? (
          <p className="p-6 text-sm text-[#766966]">Loading categories…</p>
        ) : currentOptions.length ? (
          <div className="divide-y divide-[#f3eeeb]">
            {currentOptions.map((option) => (
              <article key={option.value} className="px-5 py-4 sm:px-7">
                <div className="flex flex-wrap items-center gap-3">
                  {editingValue === option.value ? (
                    <>
                      <input
                        aria-label={`Display name for ${option.value}`}
                        className="min-w-44 rounded-lg border border-[#e7ddd8] px-3 py-2 text-sm"
                        value={label}
                        onChange={(event) => setLabel(event.target.value)}
                      />
                      {currentDimension?.valueType !== 'integer' && <button
                        type="button"
                        disabled={busy || !label.trim()}
                        onClick={() =>
                          void save('rename', String(option.value), label.trim())
                        }
                        className="ui-button ui-button--primary"
                      >
                        Save name
                      </button>}
                      {currentDimension?.valueType !== 'integer' && <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setEditingValue('')
                          setLabel('')
                        }}
                        className="ui-button ui-button--secondary"
                      >
                        Cancel
                      </button>}
                    </>
                  ) : (
                    <>
                      <strong className="min-w-40 text-base font-medium">
                        {option.label}
                      </strong>
                      {typeof option.image === 'object' && option.image?.url && <img src={option.image.url} alt="" className="h-10 w-10 rounded-md object-cover" />}
                      {(dimension === 'lengths' || dimension === 'shapes') && <label className="text-sm text-[#766966]">Preview image
                        <select aria-label={`Preview image for ${option.label}`} className="ml-2 max-w-56 rounded-lg border border-[#e7ddd8] bg-white px-3 py-2" disabled={busy} value={String(typeof option.image === 'object' ? option.image?.id || '' : option.image || '')} onChange={(event) => void saveImage(String(option.value), event.target.value)}>
                          <option value="">No image</option>{media?.map((item) => <option key={item.id} value={item.id}>{item.filename}</option>)}
                        </select>
                      </label>}
                      <code className="rounded-md bg-[#f7f3f0] px-2 py-1 text-sm text-[#766966]">
                        {option.value}
                      </code>
                      <span className="mr-auto text-sm text-[#766966]">
                        {option.products.length} product
                        {option.products.length === 1 ? '' : 's'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingValue(String(option.value))
                          setLabel(option.label)
                        }}
                        className="ui-button ui-button--secondary"
                      >
                        Edit name
                      </button>
                      <button
                        type="button"
                        disabled={busy || option.products.length > 0}
                        title={
                          option.products.length
                            ? 'Remove this value from every product variant first.'
                            : undefined
                        }
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete the unused category “${option.label}”?`,
                            )
                          )
                            void save('delete', String(option.value))
                        }}
                        className="ui-button ui-button--secondary"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedValue(
                            expandedValue === String(option.value) ? '' : String(option.value),
                          )
                        }
                        className="ui-button ui-button--secondary"
                      >
                        {expandedValue === String(option.value)
                          ? 'Hide products'
                          : 'View products'}
                      </button>
                    </>
                  )}
                </div>
                {editingValue !== option.value &&
                  option.products.length > 0 && (
                    <p className="mt-2 text-sm text-[#968680]">
                      Used by {option.products.length} product
                      {option.products.length === 1 ? '' : 's'}; remove it from
                      every variant before deleting.
                    </p>
                  )}
                {expandedValue === option.value && (
                  <div className="mt-3 rounded-xl bg-[#fcfaf9] p-4 text-sm">
                    {option.products.length ? (
                      <ul className="space-y-2">
                        {option.products.map((product) => (
                          <li key={product.id}>
                            <Link
                              className="font-medium text-[#8b5d53] underline underline-offset-2"
                              href={`/admin/collections/products/${encodeURIComponent(String(product.id))}`}
                            >
                              {product.title || `Product ${product.id}`}
                            </Link>
                            <span className="ml-2 text-[#968680]">
                              {product.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[#766966]">
                        No products use this category yet.
                      </p>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="p-6 text-sm text-[#766966]">
            {currentDimension?.valueType === 'integer' ? 'No product variants use this dimension yet.' : 'No options. Add a category to make it available in Product Studio.'}
          </p>
        )}
      </section>
    </main>
  )
}
