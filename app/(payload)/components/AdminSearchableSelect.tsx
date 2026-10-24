'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Image from 'next/image'
import type { CSSProperties, KeyboardEvent } from 'react'

export type SearchOption = { value: string; label: string; imageUrl?: string | null }

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
  searchPlaceholder = 'Search by image name…',
  emptyMessage = 'No images match that name.',
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
  searchPlaceholder?: string
  emptyMessage?: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputID = useId()
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const matching = options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()))
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: PointerEvent) => {
      if (!detailsRef.current?.contains(event.target as Node)) {
        detailsRef.current?.removeAttribute('open')
        setOpen(false)
        setQuery('')
      }
    }
    window.addEventListener('pointerdown', closeOutside)
    return () => window.removeEventListener('pointerdown', closeOutside)
  }, [open])

  const close = () => {
    detailsRef.current?.removeAttribute('open')
    setOpen(false)
    setQuery('')
  }

  const choose = (nextValue: string) => {
    onChange(nextValue)
    close()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDetailsElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
    }
  }

  return <div className={`admin-searchable-select ${wrapperClassName || ''}`}>
    <details
      ref={detailsRef}
      className={`admin-searchable-select-menu ${className || ''}`}
      onToggle={(event) => { setOpen(event.currentTarget.open); if (!event.currentTarget.open) setQuery('') }}
      onKeyDown={onKeyDown}
    >
      <summary aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} aria-disabled={disabled} onClick={(event) => { if (disabled) event.preventDefault() }} style={style}>
        <span>{selected?.label || placeholder}</span>
      </summary>
      {!disabled && <div className="admin-searchable-select-popover">
        <input
          id={inputID}
          type="search"
          aria-label={`Search ${ariaLabel} by name`}
          className="admin-searchable-select-search"
          placeholder={searchPlaceholder}
          value={query}
          autoFocus={open}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="admin-searchable-select-options" role="listbox" aria-label={ariaLabel}>
          <button type="button" role="option" aria-selected={!value} onClick={() => choose('')}>{placeholder}</button>
          {matching.map((option) => <button type="button" role="option" aria-selected={option.value === value} key={option.value} onClick={() => choose(option.value)}>
            {option.imageUrl ? <span className="admin-searchable-select-thumbnail"><Image src={option.imageUrl} alt="" fill unoptimized sizes="42px" /></span> : <span className="admin-searchable-select-thumbnail-placeholder" aria-hidden="true" />}
            <span>{option.label}</span>
          </button>)}
          {matching.length === 0 && <p role="status">{emptyMessage}</p>}
        </div>
      </div>}
    </details>
  </div>
}
