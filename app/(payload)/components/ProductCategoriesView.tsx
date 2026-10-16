'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { readJSONResponse } from '@/lib/read-json-response'
import { defaultProductDimensionOptions } from '@/lib/product-dimensions'
import { ProductWorkspaceTabs } from './ProductWorkspaceTabs'

type Dimension = 'lengths' | 'shapes'
type CategoryOption = {
  value: string
  label: string
  products: { id: string | number; title: string; status: string }[]
}
type CategoryResponse = { options: Record<Dimension, CategoryOption[]> }

const initialOptions = {
  lengths: defaultProductDimensionOptions.lengths.map((option) => ({
    ...option,
    products: [],
  })),
  shapes: defaultProductDimensionOptions.shapes.map((option) => ({
    ...option,
    products: [],
  })),
}

export function ProductCategoriesView() {
  const [dimension, setDimension] = useState<Dimension>('lengths')
  const [options, setOptions] =
    useState<CategoryResponse['options']>(initialOptions)
  const [label, setLabel] = useState('')
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
        if (active) setOptions(data.options)
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
      setOptions(data.options)
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

  const add = () => {
    const nextLabel = label.trim()
    const value = nextLabel
      .toLocaleLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{N}-]+/gu, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    if (!nextLabel || !value) {
      setError('Enter a category name using letters or numbers.')
      return
    }
    void save('add', value, nextLabel)
  }

  const currentOptions = options[dimension]

  return (
    <main className="product-studio mx-auto min-h-screen max-w-[1600px] bg-[#f7f3f0] px-5 py-10 font-sans text-base antialiased text-[#302522] sm:px-8 lg:px-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Categories</h1>
          <p className="mt-2 text-sm text-[#766966]">
            Manage Length and Shape options used by product variants.
          </p>
        </div>
      </header>

      <ProductWorkspaceTabs />

      <div
        role="tablist"
        aria-label="Product dimensions"
        className="mb-6 flex gap-2 border-b border-[#e7ddd8]"
      >
        {(
          [
            ['lengths', 'Length'],
            ['shapes', 'Shape'],
          ] as const
        ).map(([value, title]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={dimension === value}
            onClick={() => {
              setDimension(value)
              setEditingValue('')
              setLabel('')
              setExpandedValue('')
            }}
            className="border-0 border-b-2 bg-transparent px-4 py-3 text-sm"
            style={{
              borderBottomColor:
                dimension === value ? 'var(--accent)' : 'transparent',
              color:
                dimension === value
                  ? 'var(--brand-text-primary)'
                  : 'var(--brand-text-secondary)',
              fontWeight: dimension === value ? 600 : 400,
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
              {dimension === 'lengths' ? 'Length options' : 'Shape options'}
            </h2>
            <p className="mt-1 text-sm text-[#968680]">
              Display names can change without changing values stored in product
              variants.
            </p>
          </div>
          <span className="rounded-full border border-[#e7ddd8] bg-white px-3 py-2 text-sm text-[#806e68]">
            {currentOptions.length} categories
          </span>
        </div>

        <form
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
              placeholder={
                dimension === 'lengths' ? 'e.g. XX-Long' : 'e.g. Coffin'
              }
              disabled={busy}
            />
          </label>
          <button
            type="submit"
            disabled={busy || !label.trim()}
            className="rounded-xl bg-[#8b5d53] px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            Add category
          </button>
        </form>

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
                      <button
                        type="button"
                        disabled={busy || !label.trim()}
                        onClick={() =>
                          void save('rename', option.value, label.trim())
                        }
                        className="rounded-lg bg-[#8b5d53] px-3 py-2 text-sm text-white disabled:opacity-50"
                      >
                        Save name
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setEditingValue('')
                          setLabel('')
                        }}
                        className="rounded-lg border border-[#e7ddd8] px-3 py-2 text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <strong className="min-w-40 text-base font-medium">
                        {option.label}
                      </strong>
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
                          setEditingValue(option.value)
                          setLabel(option.label)
                        }}
                        className="rounded-lg border border-[#e7ddd8] px-3 py-2 text-sm"
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
                            void save('delete', option.value)
                        }}
                        className="rounded-lg border border-[#e7ddd8] px-3 py-2 text-sm text-[#8b5d53] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedValue(
                            expandedValue === option.value ? '' : option.value,
                          )
                        }
                        className="rounded-lg border border-[#e7ddd8] px-3 py-2 text-sm"
                      >
                        {expandedValue === option.value
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
            No options. Add a category to make it available in Product Studio.
          </p>
        )}
      </section>
    </main>
  )
}
