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
  border: '1px solid var(--theme-elevation-300, var(--brand-border))',
  borderRadius: 'var(--brand-radius-sm)',
  display: 'inline-flex',
  fontSize: 'var(--brand-font-size-caption)',
  minHeight: 36,
  padding: '0 12px',
  textDecoration: 'none',
}
