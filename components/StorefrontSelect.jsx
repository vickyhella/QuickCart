'use client'

import { useEffect, useId, useRef, useState } from 'react'

export default function StorefrontSelect({ ariaLabel, options, value, onChange, active = Boolean(value), className = '' }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const optionRefs = useRef([])
  const listboxId = useId()
  const selectedIndex = Math.max(0, options.findIndex((option) => String(option.value) === String(value)))
  const selectedOption = options[selectedIndex]

  useEffect(() => {
    if (!open) return
    const closeOnOutsidePointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    optionRefs.current[selectedIndex]?.focus()
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open, selectedIndex])

  const focusOption = (index) => optionRefs.current[index]?.focus()
  const handleOptionKeyDown = (event, index) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusOption((index + 1) % options.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusOption((index - 1 + options.length) % options.length)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusOption(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusOption(options.length - 1)
    } else if (event.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className={`storefront-select ${className}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        className={`storefront-select-trigger${active ? ' is-active' : ''}`}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            setOpen(true)
          }
        }}
      >
        <span>{selectedOption?.label ?? ''}</span>
        <svg aria-hidden="true" viewBox="0 0 16 16" className={`storefront-select-chevron${open ? ' is-open' : ''}`}>
          <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
        </svg>
      </button>
      <div id={listboxId} role="listbox" aria-label={ariaLabel} className="storefront-select-menu" hidden={!open}>
        {options.map((option, index) => {
          const selected = String(option.value) === String(value)
          return (
            <button
              key={String(option.value)}
              ref={(element) => { optionRefs.current[index] = element }}
              type="button"
              role="option"
              aria-selected={selected}
              tabIndex={-1}
              className={`storefront-select-option${selected ? ' is-selected' : ''}`}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
                triggerRef.current?.focus()
              }}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
