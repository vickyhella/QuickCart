'use client'

import { Link, NavGroup } from '@payloadcms/ui'
import { usePathname, useSearchParams } from 'next/navigation'

export function MarketingNavLink() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const links = [
    { label: 'Feeds', tab: 'feeds' },
    { label: 'SEO & Media', tab: 'seo' },
    { label: 'Countries', tab: 'countries' },
  ]
  return <NavGroup label="Marketing" isOpen>
    {links.map(({ label, tab }) => {
      const href = `/admin/collections/products/marketing?tab=${tab}`
      const active = pathname.replace(/\/$/, '') === '/admin/collections/products/marketing' && searchParams.get('tab') === tab
      return <Link key={tab} className="nav__link" href={href} prefetch={false}>
        {active && <div className="nav__link-indicator" />}
        <span className="nav__link-label">{label}</span>
      </Link>
    })}
  </NavGroup>
}
