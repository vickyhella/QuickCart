'use client'

import { Link, NavGroup } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import { studioLinks } from '../../../lib/admin-navigation'

export function StudioNavLink() {
  const pathname = usePathname()
  return <NavGroup label="Studios" isOpen>
    {studioLinks.map(({ label, href }) => {
      const active = pathname === href || (href === '/studio' && pathname.startsWith('/studio/') && pathname !== '/studio/spreadsheet')
      return <Link key={href} className="nav__link" href={href} prefetch={false}>
        {active && <div className="nav__link-indicator" />}
        <span className="nav__link-label">{label}</span>
      </Link>
    })}
  </NavGroup>
}
