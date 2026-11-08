import { readFileSync } from 'node:fs'
import path from 'node:path'
import contentSources from '../config/content-sources.json'
import nailSizeChart from '../config/nail-size-chart.json'
import { repositoryPages } from './repository-pages'
import { getShippingSettings, shippingPolicyDetails } from './shipping-config'

const sizeChartMarkdown = [
  `| ${nailSizeChart.columns.join(' | ')} |`,
  `| ${nailSizeChart.columns.map(() => '---').join(' | ')} |`,
  ...nailSizeChart.rows.map(([size, ...widths]) => `| ${size} | ${widths.map((width) => `${width} mm`).join(' | ')} |`),
].join('\n')

export function readRepositoryPage(slug: string) {
  const page = repositoryPages.find((page) => page.slug === slug)
  if (!page) throw new Error(`Unknown repository page: ${slug}`)
  const source = readFileSync(path.join(process.cwd(), 'content/pages', `${page.slug}.md`), 'utf8')
  const body = page.slug === 'shipping-policy'
    ? source.replace('{{shippingDetails}}', shippingPolicyDetails())
    : page.slug === 'size-guide' ? source.replace('{{sizeChart}}', sizeChartMarkdown) : source
  if (!body.trim()) throw new Error(`Empty repository page: ${slug}`)
  return { ...page, body }
}

export async function getPublicRepositoryPage(slug: string) {
  const repositoryPolicy = contentSources.policies === 'repository'
  if (repositoryPolicy && contentSources.shipping === 'repository') return readRepositoryPage(slug)
  const { connection } = await import('next/server')
  const { getPayload } = await import('payload')
  const { default: config } = await import('@/payload.config')
  await connection()
  const payload = await getPayload({ config })
  if (repositoryPolicy) {
    const page = readRepositoryPage(slug)
    return slug === 'shipping-policy'
      ? { ...page, body: page.body.replace(shippingPolicyDetails(), shippingPolicyDetails(await getShippingSettings(payload))) }
      : page
  }
  const result = await payload.find({
    collection: 'pages', where: { slug: { equals: slug }, status: { equals: 'published' } },
    limit: 1, depth: 0, overrideAccess: true,
  })
  const page = result.docs[0]
  if (!page) return null
  let body = String(page.body || '')
  if (slug === 'shipping-policy') body = body.replace('{{shippingDetails}}', shippingPolicyDetails(await getShippingSettings(payload)))
  if (slug === 'size-guide') body = body.replace('{{sizeChart}}', sizeChartMarkdown)
  return { slug, title: String(page.title || ''), seoTitle: String(page.seoTitle || ''), description: String(page.seoDescription || ''), body }
}

export async function getPublicRepositoryPageMetadata(slug: string) {
  const page = contentSources.policies === 'repository'
    ? repositoryPages.find((item) => item.slug === slug)
    : await getPublicRepositoryPage(slug)
  if (!page) return {}
  let brandName = 'Ginny Nana'
  if (contentSources.site === 'admin') {
    const { connection } = await import('next/server')
    const { getPayload } = await import('payload')
    const { default: config } = await import('@/payload.config')
    const { getAdminSiteSettings } = await import('./storefront-content')
    await connection()
    brandName = (await getAdminSiteSettings(await getPayload({ config }))).brandName
  }
  return { title: `${(page as any).seoTitle || page.title} | ${brandName}`, description: page.description || undefined }
}
