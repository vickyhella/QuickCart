import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { Pages } from '../collections/Pages'
import { StoreSettings } from '../globals/StoreSettings'
import { readRepositoryPage } from '../lib/repository-page-content'
import { isRepositoryPage, mergeRepositoryPages, repositoryPages, repositoryPageSlugs } from '../lib/repository-pages'
import { checkoutCountries, shippingEstimate, shippingSettings, shippingPolicyDetails } from '../lib/shipping-config'
import { calculateShippingCharge } from '../lib/shipping-tiers'
import { RepositoryPagesNotice, RepositoryShippingNotice } from '../app/(payload)/components/RepositorySettings'

test('all six repository pages contain HTML-readable content, metadata and permanent footer links', () => {
  for (const page of repositoryPages) {
    const { body } = readRepositoryPage(page.slug)
    assert.ok(body.length > 100, page.slug)
    assert.doesNotMatch(body, /\{\{|WooCommerce|WordPress|【\d+†/i)
    assert.ok(page.description.length)
    const route = readFileSync(new URL(`../app/(storefront)/${page.slug}/page.jsx`, import.meta.url), 'utf8')
    assert.match(route, /generateMetadata/)
    assert.doesNotMatch(route, /payload|getPayload|findGlobal/)
    const links = mergeRepositoryPages([{ ...page, title: 'Obsolete database title' }])
    assert.equal(links.filter(({ slug }) => slug === page.slug).length, 1)
    assert.equal(links.find(({ slug }) => slug === page.slug)?.title, page.title)
  }
  assert.equal(mergeRepositoryPages().length, 6)
  assert.throws(() => readRepositoryPage('../payload.config'), /Unknown repository page/)
  const shippingHTML = renderToStaticMarkup(createElement(ReactMarkdown, { remarkPlugins: [remarkGfm] }, readRepositoryPage('shipping-policy').body))
  assert.match(shippingHTML, /<table>/)
  assert.equal((shippingHTML.match(/<tbody>[\s\S]*<\/tbody>/)?.[0].match(/<tr>/g) || []).length, 3)
  assert.match(shippingHTML, /USD 50\.00/)
  assert.match(shippingHTML, /12–25 business days/)
  const pageResolver = readFileSync(new URL('../lib/repository-page-content.ts', import.meta.url), 'utf8')
  assert.match(pageResolver, /repositoryPolicy && contentSources\.shipping === 'repository'/)
  assert.match(pageResolver, /await import\('payload'\)/)
})

test('reserved pages cannot be overwritten, renamed or recreated in Admin or CMS writes', async () => {
  const hook = Pages.hooks!.beforeValidate![0] as any
  const req = { payload: { find: async () => ({ docs: [] }) } }
  for (const slug of repositoryPageSlugs) {
    assert.equal(isRepositoryPage(slug), true)
    await assert.rejects(hook({ data: { title: 'New title', slug }, req }), /maintained in content\/pages/)
    await assert.rejects(hook({ data: { title: 'Renamed', slug: 'renamed' }, originalDoc: { slug }, req }), /maintained in content\/pages/)
  }
  await assert.rejects(hook({ data: { title: 'Privacy Policy' }, req }), /maintained in content\/pages/)
  const normal = await hook({ data: { title: 'Sizing guide' }, req })
  assert.equal(normal.slug, 'sizing-guide')
  const adminReq = { user: { collection: 'users', id: 1 } }
  for (const action of ['read', 'update', 'delete']) {
    assert.deepEqual(await (Pages.access as any)[action]({ req: adminReq }), { slug: { not_in: repositoryPageSlugs } })
  }
  assert.equal(await (StoreSettings.access!.update as any)({ req: adminReq }), false)
  assert.ok(Pages.admin?.components?.beforeList?.includes('/components/RepositorySettings#RepositoryPagesNotice'))
  assert.ok(StoreSettings.fields.some((field: any) => field.admin?.components?.Field === '/components/RepositorySettings#RepositoryShippingNotice'))
})

test('confirmed weight boundaries, rounding, quantities and free threshold use repository shipping rules', () => {
  const quote = (weight: number, subtotal = 49.99, quantity = 1) => calculateShippingCharge(shippingSettings, {
    subtotal, quantity, lines: [{ product: { shippingWeight: weight }, quantity }],
  })
  for (const [weight, expected] of [[0.0001, 9], [0.201, 9], [0.20101, 12], [0.2011, 12], [0.601, 12], [0.60101, 0], [0.6011, 0], [10, 0]]) {
    assert.deepEqual(quote(weight), { shippingTotal: expected }, `weight ${weight}`)
  }
  assert.deepEqual(quote(0.2, 50), { shippingTotal: 0 })
  assert.deepEqual(quote(0.2, 49.99), { shippingTotal: 9 })
  assert.deepEqual(quote(0.2, 20, 2), { shippingTotal: 12 })
  assert.deepEqual(quote(0.2, 20, 4), { shippingTotal: 0 })
  assert.equal(shippingEstimate, 'estimated 12–25 business days including preparation')
  assert.deepEqual(checkoutCountries.map(([code]) => code), shippingSettings.availableCountries)
  assert.equal(new Set(shippingSettings.availableCountries).size, shippingSettings.availableCountries.length)
  assert.equal(shippingSettings.currency, 'USD')
  assert.equal(shippingSettings.pricesIncludeTax, true)
})

test('shipping policy renderer reflects Admin rates, destinations and handling windows', () => {
  const policy = shippingPolicyDetails({
    ...shippingSettings,
    freeShippingThreshold: 75,
    availableCountries: ['US'],
    handlingBusinessDays: { minimum: 2, maximum: 4 },
    transitBusinessDays: { minimum: 6, maximum: 8 },
    shippingCostType: 'weight',
    shippingTiers: [{ minimumWeightKg: 0.1, maximumWeightKg: 0.2, fee: 13 }],
  })
  assert.match(policy, /USD 75\.00/)
  assert.match(policy, /0\.1000–0\.2000 kg/)
  assert.match(policy, /USD 13\.00/)
  assert.match(policy, /2–4 business days/)
  assert.match(policy, /6–8 business days/)
  assert.match(policy, /United States/)
  assert.doesNotMatch(policy, /Australia/)
})

test('country endpoint serves repository settings without loading the database', async () => {
  const source = readFileSync(new URL('../app/api/marketing/countries/route.js', import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const exports: any = {}
  runInNewContext(compiled, { exports, require: (name: string) => {
    if (name === 'next/server') return { NextResponse: { json: Response.json.bind(Response) } }
    if (name === '@/config/content-sources.json') return { shipping: 'repository' }
    if (name === '@/lib/shipping-config') return { checkoutCountries }
    throw new Error(`Database / unexpected import: ${name}`)
  } })
  const response = await exports.GET()
  assert.equal(response.status, 200)
  assert.deepEqual((await response.json()).countries, checkoutCountries)
})

test('Admin previews show the same deployed rates and source file paths without editable inputs', () => {
  const shipping = renderToStaticMarkup(createElement(RepositoryShippingNotice))
  assert.match(shipping, /config\/shipping.json/)
  assert.match(shipping, /USD 9.00/)
  assert.match(shipping, /USD 12.00/)
  assert.match(shipping, /5–10 business days/)
  assert.match(shipping, /7–15 business days/)
  assert.doesNotMatch(shipping, /<input|<textarea|<select/)
  const pages = renderToStaticMarkup(createElement(RepositoryPagesNotice))
  for (const { slug } of repositoryPages) {
    assert.ok(pages.includes(`content/pages/${slug}.md`))
    assert.ok(pages.includes(`href="/${slug}/"`))
  }
})
