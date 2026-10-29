import { repositoryPages } from '../../../lib/repository-pages'
import { shippingPolicyDetails, shippingSettings } from '../../../lib/shipping-config'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import siteSettings from '@/config/site.json'
import contentSources from '@/config/content-sources.json'

const cardStyle = {
  padding: '22px 24px',
  marginBottom: 18,
  border: '1px solid var(--theme-elevation-200)',
  borderRadius: 10,
  background: 'var(--theme-elevation-0)',
  lineHeight: 1.65,
} as const

const headingStyle = { margin: '0 0 10px', fontSize: 18, lineHeight: 1.35 } as const
const paragraphStyle = { margin: '8px 0 14px', maxWidth: 850 } as const
const linkStyle = { textUnderlineOffset: 3, fontWeight: 600 } as const
const markdownComponents = {
  h2: ({ children }: any) => <h3 style={{ margin: '26px 0 10px', fontSize: 17 }}>{children}</h3>,
  p: ({ children }: any) => <p style={{ margin: '10px 0 14px', lineHeight: 1.7 }}>{children}</p>,
  ul: ({ children }: any) => <ul style={{ margin: '10px 0 18px', paddingLeft: 24, lineHeight: 1.8 }}>{children}</ul>,
  li: ({ children }: any) => <li style={{ paddingLeft: 4, margin: '3px 0' }}>{children}</li>,
  table: ({ children }: any) => <div style={{ overflowX: 'auto', margin: '16px 0 20px' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>{children}</table></div>,
  th: ({ children }: any) => <th style={{ padding: '11px 14px', textAlign: 'left', borderBottom: '2px solid var(--theme-elevation-300)', background: 'var(--theme-elevation-50)' }}>{children}</th>,
  td: ({ children }: any) => <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--theme-elevation-150)' }}>{children}</td>,
} as const

export function RepositoryShippingNotice() {
  const repositoryMode = contentSources.shipping === 'repository'
  const siteRepositoryMode = contentSources.site === 'repository'
  return <div style={{ marginBottom: 24, maxWidth: 1000 }}>
    <section style={cardStyle}>
      <p style={{ margin: '0 0 5px', color: 'var(--theme-elevation-500)', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>{repositoryMode ? 'Repository managed · read only' : 'Admin managed'}</p>
      <h2 style={headingStyle}>Shipping configuration</h2>
      <p style={paragraphStyle}>{repositoryMode ? <>Edit <code>config/shipping.json</code> in the repository and redeploy. Checkout, country selection and the shipping policy use the same settings. Archived database values are not used.</> : <>Edit the shipping fields below and save this global. Checkout, country selection and the shipping policy read these Admin settings. Handling and transit estimates remain in <code>config/shipping.json</code>.</>}</p>
      <p style={paragraphStyle}><a style={linkStyle} href="/shipping-policy/" target="_blank" rel="noreferrer">Preview shipping policy ↗</a><span style={{ margin: '0 10px', color: 'var(--theme-elevation-400)' }}>·</span>Maintenance guide: <code>docs/store-policies.md</code></p>
      {repositoryMode && <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{shippingPolicyDetails()}</ReactMarkdown>}
      <p style={{ ...paragraphStyle, paddingTop: 12, borderTop: '1px solid var(--theme-elevation-150)' }}>Currency: {shippingSettings.currency}<br />Prices include tax: Yes<br />Minimum order value: {shippingSettings.minimumOrderValue ?? 'None'}</p>
      <p style={{ ...paragraphStyle, marginBottom: 0, color: 'var(--theme-elevation-600)' }}>Keep Google Merchant Center rates, destinations and handling / transit times aligned with these settings.</p>
    </section>

    <section style={cardStyle}>
      <p style={{ margin: '0 0 5px', color: 'var(--theme-elevation-500)', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>{siteRepositoryMode ? 'Repository managed' : 'Admin managed'}</p>
      <h2 style={headingStyle}>Brand and default SEO</h2>
      {siteRepositoryMode && <dl style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 170px) 1fr', gap: '8px 16px', margin: '16px 0' }}>
        <dt style={{ color: 'var(--theme-elevation-500)' }}>Brand</dt><dd style={{ margin: 0 }}>{siteSettings.brandName}</dd>
        <dt style={{ color: 'var(--theme-elevation-500)' }}>Customer email</dt><dd style={{ margin: 0 }}><a href={`mailto:${siteSettings.customerEmail}`}>{siteSettings.customerEmail}</a></dd>
        <dt style={{ color: 'var(--theme-elevation-500)' }}>Default SEO title</dt><dd style={{ margin: 0 }}>{siteSettings.defaultSeo.title}</dd>
        <dt style={{ color: 'var(--theme-elevation-500)' }}>Default SEO description</dt><dd style={{ margin: 0 }}>{siteSettings.defaultSeo.description}</dd>
        <dt style={{ color: 'var(--theme-elevation-500)' }}>Social links</dt><dd style={{ margin: 0 }}>{siteSettings.socialLinks.length ? siteSettings.socialLinks.map((link) => link.url).join(', ') : 'None configured'}</dd>
      </dl>}
      <p style={{ ...paragraphStyle, marginBottom: 0 }}>{siteRepositoryMode ? <>Edit <code>config/site.json</code> and redeploy.</> : <>Edit the Site identity tab in Marketing Studio; changes appear on the storefront after saving.</>} <a style={linkStyle} href="/" target="_blank" rel="noreferrer">Preview storefront ↗</a></p>
    </section>

    <section style={cardStyle}>
      <p style={{ margin: '0 0 5px', color: 'var(--theme-elevation-500)', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>{contentSources.homepage === 'repository' && contentSources.categoryImages === 'repository' ? 'Repository managed' : 'Mixed sources'}</p>
      <h2 style={headingStyle}>Homepage and category images</h2>
      <p style={paragraphStyle}>{contentSources.homepage === 'repository' ? <>Homepage copy and hero image: <code>config/homepage.json</code>. Image files: <code>public/site/</code>.</> : <>Homepage images are managed in <a href="/admin/collections/marketing/studio?tab=homepage" target="_blank" rel="noreferrer">Marketing Studio</a>; they are decorative and do not link to products.</>}</p>
      <p style={paragraphStyle}>{contentSources.categoryImages === 'repository' ? <>Length / Shape preview images: <code>config/category-images.json</code>. Changes take effect after deployment.</> : <>Length / Shape preview images are edited on the Product Dimensions global using the existing category image editor.</>}</p>
      <p style={{ ...paragraphStyle, marginBottom: 0 }}><a style={linkStyle} href="/" target="_blank" rel="noreferrer">Homepage ↗</a><span style={{ margin: '0 10px', color: 'var(--theme-elevation-400)' }}>·</span><a style={linkStyle} href="/by-length/" target="_blank" rel="noreferrer">Length categories ↗</a><span style={{ margin: '0 10px', color: 'var(--theme-elevation-400)' }}>·</span><a style={linkStyle} href="/by-shape/" target="_blank" rel="noreferrer">Shape categories ↗</a></p>
    </section>
  </div>
}

export function RepositoryPagesNotice() {
  const repositoryMode = contentSources.policies === 'repository'
  if (!repositoryMode) return <section style={cardStyle}><p style={{ margin: '0 0 5px', color: 'var(--theme-elevation-500)', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Admin managed</p><h2 style={headingStyle}>Policy pages</h2><p style={{ ...paragraphStyle, marginBottom: 0 }}>The storefront reads published policy pages from this collection. Edit pages here; no deployment is required.</p></section>
  return <section style={cardStyle}>
    <p style={{ margin: '0 0 5px', color: 'var(--theme-elevation-500)', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Repository managed · read only</p>
    <h2 style={headingStyle}>Policy pages</h2>
    <p style={paragraphStyle}>Edit the Markdown file in the repository and redeploy to publish. Database copies are archived and are not displayed on the storefront.</p>
    <ul style={{ display: 'grid', gap: 9, margin: '16px 0', paddingLeft: 22 }}>
      {repositoryPages.map((page) => <li key={page.slug} style={{ paddingLeft: 4 }}>
        <a href={`/${page.slug}/`} target="_blank" rel="noreferrer">{page.title}</a>
        <span style={{ margin: '0 8px', color: 'var(--theme-elevation-400)' }}>·</span><code>content/pages/{page.slug}.md</code>
      </li>)}
    </ul>
    <p style={{ ...paragraphStyle, marginBottom: 0 }}>Maintenance guide: <code>docs/store-policies.md</code></p>
  </section>
}
