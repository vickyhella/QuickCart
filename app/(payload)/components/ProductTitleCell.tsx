'use client'

import Link from 'next/link'

export function ProductTitleCell({ cellData, rowData }: { cellData?: unknown; rowData?: { id?: string | number } }) {
  if (!rowData?.id) return <span>{String(cellData || '')}</span>
  return <Link href={`/admin/collections/products/${encodeURIComponent(String(rowData.id))}`} style={{ color: 'var(--theme-text)', textDecoration: 'underline', textUnderlineOffset: 3 }}>{String(cellData || 'Untitled product')}</Link>
}
