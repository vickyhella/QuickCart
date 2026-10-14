import Link from 'next/link'
import type { CSSProperties } from 'react'

export function StorefrontHomeAction() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Link href="/admin" style={actionStyle}>Admin home</Link>
      <Link href="/" style={actionStyle}>Storefront homepage ↗</Link>
    </div>
  )
}

const actionStyle: CSSProperties = {
  alignItems: 'center',
  border: '1px solid var(--theme-elevation-300, #d8d8d8)',
  borderRadius: 6,
  display: 'inline-flex',
  fontSize: 13,
  minHeight: 36,
  padding: '0 12px',
  textDecoration: 'none',
}
