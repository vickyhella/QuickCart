'use client'

import { Link, NavGroup } from '@payloadcms/ui'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { isMediaNavigationActive, studioLinks } from '../../../lib/admin-navigation'

export function StudioNavLink() {
  const pathname = usePathname()
  useEffect(() => {
    const mediaLink = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nav a[href]'))
      .find((link) => new URL(link.href).pathname.replace(/\/$/, '') === '/admin/collections/media')

    if (mediaLink) {
      const currentIndicator = mediaLink.querySelector<HTMLElement>('.nav__link-indicator')
      if (isMediaNavigationActive(pathname) && currentIndicator) currentIndicator.dataset.quickcartIndicator = 'true'
      else if (isMediaNavigationActive(pathname)) {
        const indicator = document.createElement('div')
        indicator.className = 'nav__link-indicator'
        indicator.dataset.quickcartIndicator = 'true'
        mediaLink.prepend(indicator)
      } else {
        mediaLink.querySelector('[data-quickcart-indicator="true"]')?.remove()
      }
    }
  }, [pathname])

  return <>
    <NavGroup label="Studio" isOpen>
      {studioLinks.map(({ label, href }) => {
        const active = pathname === href
        return <Link key={href} className="nav__link" href={href} prefetch={false}>
          {active && <div className="nav__link-indicator" />}
          <span className="nav__link-label">{label}</span>
        </Link>
      })}
    </NavGroup>
  </>
}
