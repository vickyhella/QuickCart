import { readFileSync } from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../payload.config'
import { repositoryPages } from '../lib/repository-pages'

const apply = process.argv.includes('--apply')
const overwrite = process.argv.includes('--overwrite')
if (apply) process.env.SEED_REPOSITORY_PAGES = 'true'
const payload = await getPayload({ config })

for (const page of repositoryPages) {
  const body = readFileSync(path.join(process.cwd(), 'content/pages', `${page.slug}.md`), 'utf8')
  const existing = await payload.find({ collection: 'pages', where: { slug: { equals: page.slug } }, limit: 1, depth: 0, overrideAccess: true })
  const current = existing.docs[0]
  if (current && !overwrite) {
    console.info(`EXISTS /${page.slug}/ — kept existing Admin content; compare it with content/pages/${page.slug}.md`)
    continue
  }
  if (!apply) {
    console.info(`${current ? 'UPDATE' : 'CREATE'} /${page.slug}/ — ${page.title}`)
    continue
  }
  const data = { title: page.title, body, placement: page.placement, seoDescription: page.description, status: 'published' as const }
  if (current) {
    await payload.update({ collection: 'pages', id: current.id, data, overrideAccess: true })
    console.info(`UPDATED /${page.slug}/`)
  } else {
    await payload.create({ collection: 'pages', data: { ...data, slug: page.slug }, overrideAccess: true })
    console.info(`CREATED /${page.slug}/`)
  }
}

if (!apply) console.info('Preview only. Pass --apply to create missing pages; add --overwrite only after reviewing existing Admin content.')
