import type { AdminViewServerProps } from 'payload'
import { Gutter } from '@payloadcms/ui'
import { adminDashboardSections } from '../../../lib/admin-navigation'

export function AdminDashboard({ initPageResult }: AdminViewServerProps) {
  return (
    <Gutter className="admin-dashboard">
      <h1>Dashboard</h1>
      <div className="admin-dashboard-shortcuts">
        {adminDashboardSections.map((section) => <section className="admin-dashboard-shortcuts__section" key={section.title}>
          <h2>{section.title}</h2>
          <nav className="admin-dashboard-shortcuts__grid" aria-label={section.title}>
            {section.links.map(({ label, href, description }) => <a className="admin-dashboard-shortcuts__link" href={href} key={href}>
              <strong>{label}</strong><span>{description}</span>
            </a>)}
          </nav>
        </section>)}
      </div>
    </Gutter>
  )
}
