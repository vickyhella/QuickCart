'use client'

import { Link, NavGroup } from '@payloadcms/ui'
import { usePathname, useSearchParams } from 'next/navigation'
import { storeFeedLinks } from '../../../lib/admin-navigation'

export function MarketingNavLink() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  return <NavGroup label="Store & Feeds" isOpen>
    {storeFeedLinks.map(({ label, tab, href }) => {
      const active = pathname.replace(/\/$/, '') === '/admin/collections/products/marketing' && searchParams.get('tab') === tab
      return <Link key={tab} className="nav__link" href={href} prefetch={false}>
        {active && <div className="nav__link-indicator" />}
        <span className="nav__link-label">{label}</span>
      </Link>
    })}
  </NavGroup>
}
