'use client'

import { useSelection } from '@payloadcms/ui'
import { useState } from 'react'

export function ProductListActions() {
  const { selectedIDs, setSelection, selectAll } = useSelection()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function remove(force = false) {
    setBusy(true)
    setMessage('')
    try {
      const ids = selectedIDs.map(String)
      const response = await fetch('/api/studio/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          items: ids.map((id) => ({ id })),
          force,
        }),
      })
      const data = await response.json()
      if (response.status === 409 && data.requiresForce) {
        if (
          window.confirm(
            `${data.referenced.length} selected product(s) are referenced by orders or Pinterest posts. Continue? Historical records remain; shared or referenced images will be kept.`,
          )
        )
          await remove(true)
        return
      }
      if (!response.ok)
        throw new Error(data.error || 'Could not delete products.')
      ids.forEach((id) => setSelection(id))
      setMessage(`Deleted ${data.deleted.length} product(s).`)
      window.location.reload()
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : 'Could not delete products.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (!selectedIDs.length && selectAll !== 'allAvailable') return null
  if (selectAll === 'allAvailable') {
    return (
      <p className="my-3 text-sm text-[#766966]">
        To delete safely, select individual products or the current page instead
        of all matching products.
      </p>
    )
  }
  return (
    <div className="my-3 flex items-center gap-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          if (
            window.confirm(
              `Permanently delete ${selectedIDs.length} selected product(s)? Images and originals used only by these products will also be removed.`,
            )
          )
            void remove()
        }}
        className="ui-button ui-button--danger text-red-700"
      >
        {busy ? 'Deleting…' : `Delete selected (${selectedIDs.length})`}
      </button>
      {message && (
        <span role="status" className="text-sm text-red-700">
          {message}
        </span>
      )}
    </div>
  )
}
