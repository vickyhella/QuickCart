'use client'

import { useId, useState } from 'react'
import type { CSSProperties } from 'react'

export type SearchOption = { value: string; label: string }

export function AdminSearchableSelect({
  ariaLabel,
  options,
  value,
  onChange,
  placeholder,
  style,
  className,
  wrapperClassName,
  disabled,
}: {
  ariaLabel: string
  options: SearchOption[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  style?: CSSProperties
  className?: string
  wrapperClassName?: string
  disabled?: boolean
}) {
  const [query, setQuery] = useState('')
  const inputID = useId()
  const matching = options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()))
  const selected = options.find((option) => option.value === value)
  const visible = selected && !matching.some((option) => option.value === selected.value) ? [selected, ...matching] : matching

  return <div className={`admin-searchable-select ${wrapperClassName || ''}`}>
    <input
      id={inputID}
      type="search"
      aria-label={`Search ${ariaLabel} by name`}
      className="admin-image-search"
      placeholder="Search by image name…"
      value={query}
      disabled={disabled}
      onChange={(event) => setQuery(event.target.value)}
    />
    <select
      aria-label={ariaLabel}
      className={className}
      style={style}
      value={value}
      disabled={disabled}
      onChange={(event) => { onChange(event.target.value); setQuery('') }}
    >
      <option value="">{placeholder}</option>
      {visible.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    {query && matching.length === 0 && <small role="status">No images match that name.</small>}
  </div>
}
