import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { AsyncLocalStorage } from 'node:async_hooks'
import ts from 'typescript'
import * as mediaResolver from '../lib/resolve-product-media.js'
import * as pricing from '../lib/product-pricing'
import * as merchantDescription from '../lib/merchant-feed-description.js'
import { getMarketingSettingsForRequest, setMarketingSettingsForRequest } from '../lib/marketing-settings-request'
import * as settingsRequest from '../lib/marketing-settings-request'
import * as templateSync from '../lib/product-template-sync'

function load(path: string, modules: Record<string, any>) {
  const code = ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText
  const exports: any = {}
  runInNewContext(code, {
    exports, Buffer, Response, Request, URL, Set, Map, Promise,
    console: { info() {}, warn() {}, error() {} },
    require: (name: string) => { assert.ok(name in modules, `Unmocked import ${name}`); return modules[name] },
  })
  return exports
}

// Isolate the real readers/handlers from the database and Next's external cache storage.
function fixture() {
  const entries = new Map<string, { value: any; tags: string[] }>()
  const cacheScope = new AsyncLocalStorage<boolean>()
  const nextCache = {
    unstable_cache: (read: Function, key: string[], options: { tags: string[]; revalidate: number }) => async (...args: any[]) => {
      assert.equal(options.revalidate, 300)
      // Next deliberately bypasses inner unstable_cache readers in an existing cache scope.
      if (cacheScope.getStore()) return read(...args)
      const id = JSON.stringify([key, args])
      if (!entries.has(id)) entries.set(id, { value: await cacheScope.run(true, () => read(...args)), tags: options.tags })
      return entries.get(id)!.value
    },
    revalidateTag: (tag: string, profile: { expire: number }) => {
      assert.equal(profile.expire, 0)
      for (const [key, entry] of entries) if (entry.tags.includes(tag)) entries.delete(key)
    },
  }
  const products = [{ id: 1, title: 'Rose', slug: 'rose', status: 'published', category: 'mystery-box', price: 20, featuredImage: 10, gallery: [], variants: [{ id: 's', size: 's', image: 11, stock: 2, trackStock: true, enabled: true }], seoTitle: 'Rose nails' }]
  const settings: any = { homepageHeroProduct: 1, homepageHeroImage: 12, homepageMysteryBoxProduct: 1 }
  const queries: any[] = []
  const payload = {
    find: async (query: any) => {
      queries.push(query)
      assert.equal(query.depth, 0)
      assert.ok(query.select, 'Every public read must project its required fields')
      if (query.collection === 'products') {
        assert.equal(query.where.status.equals, 'published')
        assert.equal(query.select.suppliers, undefined)
        assert.equal(query.select.supplierSKU, undefined)
        assert.equal(query.select.variants.suppliers, undefined)
        const offset = ((query.page || 1) - 1) * query.limit
        return { docs: structuredClone(products.slice(offset, offset + query.limit)), hasNextPage: offset + query.limit < products.length }
      }
      assert.equal(query.collection, 'media')
      return { docs: query.where.id.in.map((id: number | string) => ({ id, url: `/image-${id}.webp`, altText: 'Nails' })) }
    },
    findGlobal: async (query: any) => {
      queries.push(query)
      assert.equal(query.depth, 0, 'Globals must not recursively populate selected products')
      return structuredClone(settings)
    },
  }
  const policy = load('lib/storefront-cache.ts', { 'next/cache.js': nextCache })
  const modules: Record<string, any> = {
    'next/cache': nextCache, 'next/server': { NextResponse: { json: Response.json.bind(Response) } },
    '@/payload.config': { default: {} }, payload: { getPayload: async () => payload },
    './resolve-product-media': mediaResolver, './storefront-cache': policy, '@/lib/storefront-cache': policy,
    '@/lib/environment-config': { getEnvironmentVariable: () => '' },
    '@/lib/product-pricing': pricing, '@/lib/merchant-feed-description': merchantDescription,
  }
  const catalog = load('lib/storefront-catalog.ts', modules)
  modules['@/lib/storefront-catalog'] = catalog
  return { payload, products, settings, queries, policy, catalog, modules }
}

test('homepage, catalog, searches and both feeds share one projected product/media read', async () => {
  const { modules, queries, catalog } = fixture()
  const routes = ['app/api/storefront/homepage/route.ts', 'app/api/storefront/products/route.ts', 'app/api/storefront/search/route.ts', 'app/api/merchant/feed.xml/route.js', 'app/api/pinterest/feed.xml/route.js'].map((path) => load(path, modules))
  await Promise.all([catalog.getPublishedCatalog(), catalog.getPublishedCatalog(), catalog.getPublishedCatalog()])
  for (let visit = 0; visit < 4; visit++) {
    const homepage = await (await routes[0].GET()).json()
    assert.equal(homepage.imageUrl, '/image-12.webp')
    assert.equal(homepage.productHref, '/product/rose')
    assert.equal(homepage.mysteryBox.imageUrl, '/image-10.webp')
    const list = await (await routes[1].GET()).json()
    assert.equal(list.docs[0].variants[0].image.url, '/image-11.webp')
    for (const query of ['rose', 'ROSE', `not-found-${visit}`]) await routes[2].GET(new Request(`https://shop.example/api/storefront/search?q=${query}`))
    for (const route of routes.slice(3)) {
      const xml = await (await route.GET()).text()
      assert.match(xml, /<g:title>Rose/)
      assert.match(xml, /image-11.webp/)
    }
  }
  assert.equal(queries.filter((q) => q.collection === 'products').length, 1)
  assert.equal(queries.filter((q) => q.collection === 'media').length, 2, 'One catalog image batch plus the custom homepage image')
  assert.equal(queries.filter((q) => q.slug).length, 1)
})

test('CMS invalidation refreshes homepage, links, catalogue, search and feeds without an extra CDN stale layer', async () => {
  const { modules, products, settings, policy } = fixture()
  const homepage = load('app/api/storefront/homepage/route.ts', modules)
  const listing = load('app/api/storefront/products/route.ts', modules)
  const first = await homepage.GET()
  assert.equal(first.headers.get('cache-control'), 'no-store')
  assert.equal((await first.json()).imageUrl, '/image-12.webp')
  settings.homepageHeroImage = 14
  await policy.invalidateStorefront(policy.STOREFRONT_SETTINGS_TAG)
  assert.equal((await (await homepage.GET()).json()).imageUrl, '/image-14.webp')
  products.splice(0)
  await policy.invalidateStorefront(policy.STOREFRONT_PRODUCTS_TAG)
  assert.equal((await (await listing.GET()).json()).docs.length, 0)
  const updated = await (await homepage.GET()).json()
  assert.equal(updated.productHref, null)
  assert.equal(updated.mysteryBox, null)
  const feed = load('app/api/pinterest/feed.xml/route.js', modules)
  assert.doesNotMatch(await (await feed.GET()).text(), /<item>/)
})

test('searches match case-insensitively, paginate all catalogue pages and reject unbounded page values', async () => {
  const { modules, products } = fixture()
  for (let index = 2; index <= 125; index++) products.push({ ...products[0], id: index, title: `Rose ${index}`, slug: `rose-${index}` })
  const search = load('app/api/storefront/search/route.ts', modules)
  const lastPage = await (await search.GET(new Request('https://shop.example/search?q=ROSE&page=6'))).json()
  assert.equal(lastPage.totalDocs, 125)
  assert.equal(lastPage.docs.length, 5)
  assert.equal(lastPage.hasNextPage, false)
  for (const page of ['Infinity', '-1', 'NaN']) assert.equal((await (await search.GET(new Request(`https://shop.example/search?q=rose&page=${page}`))).json()).page, 1)
})

test('batch product validation reads settings once and uses the just-saved templates', async () => {
  let reads = 0
  const req = { payload: { findGlobal: async () => { reads++; return { productTitleTemplate: 'Old' } } } }
  const first = await getMarketingSettingsForRequest(req)
  for (let index = 0; index < 100; index++) assert.equal(await getMarketingSettingsForRequest(req), first)
  assert.equal(reads, 1)
  setMarketingSettingsForRequest(req, { productTitleTemplate: 'New' })
  assert.equal((await getMarketingSettingsForRequest(req)).productTitleTemplate, 'New')
  assert.equal(reads, 1)
})

test('a failed cache refresh can be retried and does not turn database failure into an empty cached collection', async () => {
  const { payload, catalog } = fixture()
  const find = payload.find
  let fail = true
  payload.find = async (query) => {
    if (fail) { fail = false; throw new Error('Database unavailable') }
    return find(query)
  }
  await assert.rejects(catalog.getPublishedCatalog(), /Database unavailable/)
  assert.equal((await catalog.getPublishedCatalog()).length, 1)
})

test('published product changes expire the public catalogue; draft edits and unchanged suppliers avoid extra work', async () => {
  const tags: string[] = []
  let supplierReads = 0
  const policy = { STOREFRONT_PRODUCTS_TAG: 'products', STOREFRONT_NAVIGATION_TAG: 'navigation', invalidateStorefront: async (...values: string[]) => { tags.push(...values) } }
  const { Products } = load('collections/Products.ts', {
    '../lib/admin-access': { isAdminUser: () => false }, '@/lib/product-privacy': {}, '@/lib/product-validation': {},
    '@/lib/studio-description-template': {}, '@/lib/product-newness': {},
    '@/lib/marketing-settings-request': settingsRequest, '@/lib/storefront-cache': policy,
  })
  const req = { payload: { count: async () => { supplierReads++; return { totalDocs: 1 } }, findByID: async () => { supplierReads++; return null } } }
  const afterChange = Products.hooks.afterChange[0]
  await afterChange({ doc: { status: 'draft', suppliers: null }, previousDoc: { status: 'draft', suppliers: [] }, req })
  await afterChange({ doc: { status: 'draft', suppliers: [1] }, previousDoc: { status: 'draft', suppliers: [1] }, req })
  assert.equal(tags.length, 0)
  await afterChange({ doc: { status: 'published', suppliers: [1] }, previousDoc: { status: 'draft', suppliers: [1] }, req })
  assert.deepEqual(tags, ['products', 'navigation'])
  tags.length = 0
  await afterChange({ doc: { status: 'draft', suppliers: [1] }, previousDoc: { status: 'published', suppliers: [1] }, req })
  assert.deepEqual(tags, ['products', 'navigation'])
  assert.equal(supplierReads, 0)
})

test('a real Marketing save scopes template refreshes and shares the saved settings/transaction with product hooks', async () => {
  const previousDoc = { productTitleTemplate: '{productName}' }
  const doc = { productTitleTemplate: '{brand} {productName}' }
  let scans = 0
  let updates = 0
  const req: any = { payload: {
    find: async (args: any) => {
      scans++
      assert.equal(args.req, req)
      assert.equal(args.depth, 0)
      return { docs: [{ id: 1, title: 'Rose', seoTitleMode: 'auto' }] }
    },
    update: async (args: any) => {
      updates++
      assert.equal(args.req, req)
      assert.equal((await getMarketingSettingsForRequest(req)).productTitleTemplate, doc.productTitleTemplate)
    },
  } }
  const { MarketingSettings } = load('globals/MarketingSettings.ts', {
    '../lib/admin-access': {}, '../lib/countries': { shippingCountries: [] },
    '../lib/product-template-sync': templateSync, '../lib/marketing-settings-request': settingsRequest,
    '../lib/storefront-cache': { invalidateStorefront: async () => {}, STOREFRONT_SETTINGS_TAG: 'settings', STOREFRONT_PRODUCTS_TAG: 'products' },
  })
  const save = MarketingSettings.hooks.afterChange[0]
  await save({ doc: previousDoc, previousDoc, req })
  assert.equal(scans, 0, 'Unrelated homepage saves must never scan/update the catalogue')
  await save({ doc, previousDoc, req })
  assert.equal(scans, 1)
  assert.equal(updates, 1)
})
