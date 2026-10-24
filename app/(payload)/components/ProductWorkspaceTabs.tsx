'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { productWorkspaceTabs } from '../../../lib/admin-navigation'

export function ProductWorkspaceTabs() {
  const pathname = usePathname().replace(/\/$/, '')
  const activeHref =
    productWorkspaceTabs.find(({ href }) => pathname === href)?.href ||
    productWorkspaceTabs[0].href

  return (
    <nav
      aria-label="Product Studio sections"
      role="tablist"
      className="mb-8 flex gap-2 border-b border-[#e7ddd8]"
    >
      {productWorkspaceTabs.map(({ label, href }) => {
        const active = href === activeHref
        return (
          <Link
            key={href}
            href={href}
            role="tab"
            aria-selected={active}
            prefetch={false}
            className="border-0 border-b-2 bg-transparent px-4 py-3 text-sm"
            style={{
              borderBottomColor: active ? 'var(--accent)' : 'transparent',
              color: active
                ? 'var(--brand-text-primary)'
                : 'var(--brand-text-secondary)',
              fontWeight: active ? 600 : 400,
              textDecoration: 'none',
            }}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
