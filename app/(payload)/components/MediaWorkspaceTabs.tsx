'use client'

import { usePathname } from 'next/navigation'
import { Link } from '@payloadcms/ui'
import { mediaWorkspaceTabs } from '../../../lib/admin-navigation'

export { mediaWorkspaceTabs } from '../../../lib/admin-navigation'

export function MediaWorkspaceTabs() {
  const pathname = usePathname().replace(/\/$/, '')
  return <nav aria-label="Media sections" role="tablist" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '0 0 20px', borderBottom: '1px solid var(--theme-elevation-200)' }}>
    {mediaWorkspaceTabs.map((item) => {
      const active = item.matches(pathname)
      return <Link key={item.href} href={item.href} role="tab" aria-selected={active} prefetch={false} style={{ padding: '10px 12px', borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent', color: active ? 'var(--brand-text-primary)' : 'var(--brand-text-secondary)', fontWeight: active ? 600 : 400, textDecoration: 'none' }}>{item.label}</Link>
    })}
  </nav>
}
