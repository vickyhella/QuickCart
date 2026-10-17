import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import * as pricing from '../lib/product-pricing.js'
import * as validation from '../lib/product-validation.js'
import * as shipping from '../lib/shipping-tiers.js'
import * as mergeVariants from '../lib/merge-product-variants.js'
import * as variantAttributes from '../lib/product-variant-attributes.js'

// Exercise the real route handlers with isolated CMS and payment boundaries.
function loadRoute(path: string, payload: any, extra: Record<string, unknown> = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const modules: Record<string, unknown> = {
    'node:crypto': { randomBytes },
    'next/server': { NextResponse: { json: Response.json.bind(Response) } },
    payload: { getPayload: async () => payload },
    '@payload-config': { default: {} },
    '@/payload.config': { default: {} },
    '@/lib/product-pricing': pricing,
    '@/lib/product-validation': validation,
    '@/lib/shipping-tiers': shipping,
    '@/lib/merge-product-variants': mergeVariants,
    '@/lib/product-variant-attributes': variantAttributes,
    '@/lib/checkout-error': { getCheckoutFailure: (error: Error) => ({ message: error.message, status: 400 }) },
    '@/lib/countries': { shippingCountries: [['US', 'United States']] },
    '@/lib/product-seo-templates': { resolveProductSeoTemplates: () => ({ title: '', description: '' }) },
    '@/lib/studio-description-template': { DEFAULT_STUDIO_DESCRIPTION_TEMPLATE: '' },
    '@/lib/studio-product-media': { resolveStudioProductMedia: async () => ({ media: [], unavailableCount: 0 }) },
    '@/lib/environment-config': { getEnvironmentVariable: () => '' },
    '@/lib/resolve-product-media': { resolveProductMedia: async (_payload: unknown, products: unknown[]) => products },
    ...extra,
  }
  const exports: any = {}
  runInNewContext(code, {
    exports, Response, URL, console: { error() {} },
    require: (name: string) => {
      assert.ok(name in modules, `Unmocked dependency: ${name}`)
      return modules[name]
    },
  })
  return exports
}

const request = (body: unknown, method = 'POST') => new Request('https://shop.example/api/checkout', {
  method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
})

test('real quote, saved order and PayPal amounts agree with legacy selling prices and overrides', async () => {
  for (const variantPrice of [null, 27, 35]) {
    for (const promoCode of ['', 'SAVE10']) {
      const product = { id: 1, title: 'Test', status: 'published', price: 25, compareAtPrice: 30, variants: [{ id: 'v1', price: variantPrice, compareAtPrice: null, enabled: true, stock: 10, trackStock: true }] }
      let order: any
      let payment: any
      const payload = {
        findByID: async () => product,
        findGlobal: async ({ slug }: any) => slug === 'marketing-settings' ? { availableCountries: ['US'] } : { currency: 'USD', shippingCostType: 'flat', flatShippingRate: 5, freeShippingThreshold: 50 },
        find: async () => ({ docs: [{ kind: 'percentage', value: 10 }] }),
        create: async ({ data }: any) => { order = data; return { id: 10 } },
        update: async () => ({}),
      }
      const quote = loadRoute('app/api/checkout/quote/route.js', payload)
      const checkout = loadRoute('app/api/checkout/route.js', payload, {
        '@/lib/paypal': { isPayPalConfigured: () => true, paypalRequest: async (_url: string, options: any) => { payment = options.body.purchase_units[0]; return { id: 'PAYPAL-1', links: [{ rel: 'approve', href: 'https://paypal.example/approve' }] } } },
      })
      const items = [{ productId: 1, variantId: 'v1', quantity: 2, unitPrice: 0.01 }]
      const quoteResponse = await quote.POST(request({ items, promoCode }))
      const checkoutResponse = await checkout.POST(request({ items, promoCode, email: 'buyer@example.com', address: { fullName: 'Buyer', address1: 'Street 1', city: 'NY', postalCode: '10001', country: 'US' } }))
      assert.equal(quoteResponse.status, 200)
      assert.equal(checkoutResponse.status, 200)
      const quoted = await quoteResponse.json()
      const actualPrice = variantPrice ?? product.price
      const subtotal = actualPrice * 2
      const discount = promoCode ? subtotal * 0.1 : 0
      const shippingCost = subtotal - discount >= 50 ? 0 : 5
      assert.equal(quoted.subtotal, subtotal)
      assert.equal(quoted.shippingTotal, shippingCost)
      assert.equal(quoted.total, subtotal - discount + shippingCost)
      assert.equal(order.items[0].unitPrice, actualPrice)
      assert.equal(order.total, quoted.total)
      assert.equal(payment.items[0].unit_amount.value, actualPrice.toFixed(2))
      assert.equal(payment.amount.value, quoted.total.toFixed(2))
      assert.equal(payment.amount.breakdown.item_total.value, subtotal.toFixed(2))
    }
  }
})

test('Studio creates legacy fields for a sale or regular price and rejects reversed prices', async () => {
  let created: any
  const payload = {
    auth: async () => ({ user: { id: 1 } }),
    findGlobal: async () => ({ dimensions: [] }),
    create: async ({ data }: any) => { created = data; return { id: 10 } },
  }
  const route = loadRoute('app/api/studio/products/route.ts', payload)
  for (const salePrice of ['', 25]) {
    const response = await route.POST(request({ title: 'Test', price: 30, salePrice, variants: [], combinations: [], sizes: [] }))
    assert.equal(response.status, 201)
    assert.equal(created.price, salePrice === '' ? 30 : 25)
    assert.equal(created.compareAtPrice, salePrice === '' ? null : 30)
    assert.equal('salePrice' in created, false)
  }
  created = null
  const invalid = await route.POST(request({ title: 'Test', price: 30, salePrice: 35 }))
  assert.equal(invalid.status, 400)
  assert.equal(created, null)
  const variantResponse = await route.POST(request({ title: 'Test', price: 30, salePrice: 25,
    combinations: [{ length: 'short', shape: 'almond' }], sizes: ['s'],
    variants: [{ length: 'short', shape: 'almond', size: 's', price: 20, stock: 10, enabled: true }],
  }))
  assert.equal(variantResponse.status, 201)
  assert.equal(created.variants[0].price, 20)
  assert.equal(pricing.getPriceDetails(created, created.variants[0]).salePrice, null)

  const mysteryBox = await route.POST(request({ title: 'Mystery Box', category: 'mystery-box', price: 13.9,
    combinations: [{ length: '', shape: '' }], sizes: ['xs'],
    variants: [{ length: '', shape: '', size: 'xs', price: 13.9, stock: 10, enabled: true }],
  }))
  assert.equal(mysteryBox.status, 201)
  assert.equal(created.category, 'mystery-box')
  assert.equal(created.variants[0].length, '')
  assert.equal(created.variants[0].shape, '')
})

test('Studio read-save preserves variant IDs, SKUs, charges and inherited fields', async () => {
  const original = { id: 1, updatedAt: '2026-10-16', title: 'Test', category: 'press-on-nails', status: 'draft', price: 25, compareAtPrice: 30, variants: [
    { id: 'inherited', sku: '0001-01', length: 'short', shape: 'almond', size: 's', price: null, compareAtPrice: null, stock: 10, enabled: true },
    { id: 'override', sku: '0001-02', length: 'short', shape: 'almond', size: 'm', price: 27, compareAtPrice: null, stock: 8, enabled: true },
  ] }
  let saved: any
  const payload = {
    auth: async () => ({ user: { id: 1 } }),
    findGlobal: async () => ({ dimensions: [] }),
    findByID: async () => structuredClone(original),
    find: async () => ({ docs: [] }),
    update: async ({ data }: any) => { saved = data; return { id: 1, updatedAt: 'new' } },
  }
  const route = loadRoute('app/api/studio/products/[id]/route.ts', payload)
  const context = { params: Promise.resolve({ id: '1' }) }
  const read = await route.GET(new Request('https://shop.example/api/studio/products/1'), context)
  const editor = await read.json()
  assert.equal(editor.price, 30)
  assert.equal(editor.salePrice, 25)
  assert.equal(editor.variants[0].price, '')
  assert.equal(editor.variants[1].salePrice, 27)
  const response = await route.PUT(request({ ...editor, mediaIDs: [], action: 'save' }, 'PUT'), context)
  assert.equal(response.status, 200)
  assert.equal(saved.price, original.price)
  assert.equal(saved.compareAtPrice, original.compareAtPrice)
  for (const variant of saved.variants) {
    const old = original.variants.find((row) => row.id === variant.id)!
    assert.equal(variant.sku, old.sku)
    assert.equal(variant.price, old.price)
    assert.equal(variant.compareAtPrice, old.compareAtPrice)
    assert.equal(variant.stock, old.stock)
    assert.equal('salePrice' in variant, false)
  }
  const duplicate = loadRoute('app/api/studio/products/[id]/duplicate-data/route.ts', payload)
  const copied = await (await duplicate.GET(new Request('https://shop.example/api/duplicate'), context)).json()
  assert.equal(copied.price, 30)
  assert.equal(copied.salePrice, 25)
  assert.equal(copied.priceOverrides['short|almond|s'], undefined)
  assert.equal(copied.salePriceOverrides['short|almond|m'], 27)
  const changed = await route.PUT(request({ ...editor, price: 35, salePrice: 24, mediaIDs: [], action: 'save' }, 'PUT'), context)
  assert.equal(changed.status, 200)
  assert.equal(saved.price, 24)
  assert.equal(saved.compareAtPrice, 35)
  assert.equal(saved.variants[0].price, null)
  assert.equal(saved.variants[1].price, 27)
  assert.equal(saved.variants[1].compareAtPrice, null)
})

test('Studio edit resolves media relations whether Payload returns IDs or populated objects', async () => {
  const media = [
    { id: 11, filename: 'featured.webp', mimeType: 'image/webp', url: 'https://cdn.example/featured.webp' },
    { id: 12, filename: 'gallery.webp', mimeType: 'image/webp', url: 'https://cdn.example/gallery.webp' },
    { id: 13, filename: 'variant.webp', mimeType: 'image/webp', url: 'https://cdn.example/variant.webp' },
  ]
  const payload = {
    auth: async () => ({ user: { id: 1 } }),
    findGlobal: async () => ({ dimensions: [] }),
    findByID: async () => ({ id: 1, updatedAt: '2026-10-16', title: 'test1', status: 'draft', price: 20, featuredImage: 11, gallery: [12], variants: [{ length: 'short', shape: 'almond', size: 's', image: { id: 13 }, stock: 1, enabled: true }] }),
    find: async ({ collection }: any) => collection === 'media' ? { docs: media } : { docs: [] },
  }
  const route = loadRoute('app/api/studio/products/[id]/route.ts', payload, {
    '@/lib/studio-product-media': { resolveStudioProductMedia: async (records: any[]) => ({ media: records, unavailableCount: 0 }) },
  })
  const response = await route.GET(new Request('https://shop.example/api/studio/products/1'), { params: Promise.resolve({ id: '1' }) })
  const editor = await response.json()
  assert.equal(response.status, 200)
  assert.deepEqual(editor.media.map((item: any) => item.id), [11, 12, 13])
})

test('Studio can read and save a size-only Mystery Box', async () => {
  const original = { id: 162, updatedAt: '2026-10-17', title: 'Mystery Box', category: 'mystery-box', status: 'draft', price: 13.9, compareAtPrice: 17.9, variants: [
    { id: 'xs', sku: '5439-5464', length: '', shape: '', size: 'xs', price: 13.9, compareAtPrice: 17.9, stock: 10, enabled: true },
  ] }
  let saved: any
  const payload = {
    auth: async () => ({ user: { id: 1 } }),
    findGlobal: async () => ({ dimensions: [] }),
    findByID: async () => structuredClone(original),
    find: async () => ({ docs: [] }),
    update: async ({ data }: any) => { saved = data; return { id: 162, updatedAt: 'new' } },
  }
  const route = loadRoute('app/api/studio/products/[id]/route.ts', payload)
  const context = { params: Promise.resolve({ id: '162' }) }
  const read = await route.GET(new Request('https://shop.example/api/studio/products/162'), context)
  const editor = await read.json()
  assert.equal(editor.combinations.length, 1)
  assert.equal(editor.combinations[0].length, '')
  assert.equal(editor.combinations[0].shape, '')
  const response = await route.PUT(request({ ...editor, mediaIDs: [], action: 'save' }, 'PUT'), context)
  assert.equal(response.status, 200)
  assert.equal(saved.variants[0].length, '')
  assert.equal(saved.variants[0].shape, '')
})

test('both feeds map the same legacy prices and never emit a sale for a regular-priced variant', async () => {
  const product = { id: 1, title: 'Test', price: 25, compareAtPrice: 30, featuredImage: { url: 'https://media.example/image.webp' }, variants: [
    { id: 'inherit', price: null, compareAtPrice: null },
    { id: 'sale-override', price: 27, compareAtPrice: null },
    { id: 'regular-override', price: 35, compareAtPrice: null },
  ] }
  const payload = { find: async () => ({ docs: [product], hasNextPage: false }) }
  for (const path of ['app/api/merchant/feed.xml/route.js', 'app/api/pinterest/feed.xml/route.js']) {
    const response = await loadRoute(path, payload).GET()
    const xml = await response.text()
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => match[1])
    assert.equal(items.length, 3)
    assert.match(items[0], /<g:price>30\.00 USD<\/g:price>/)
    assert.match(items[0], /<g:sale_price>25\.00 USD<\/g:sale_price>/)
    assert.match(items[1], /<g:price>30\.00 USD<\/g:price>/)
    assert.match(items[1], /<g:sale_price>27\.00 USD<\/g:sale_price>/)
    assert.match(items[2], /<g:price>35\.00 USD<\/g:price>/)
    assert.doesNotMatch(items[2], /<g:sale_price>/)
  }
})

test('missing stored prices cannot silently become free order lines', async () => {
  const payload = {
    findByID: async () => ({ id: 1, title: 'Test', status: 'published', price: null }),
    findGlobal: async () => ({ availableCountries: ['US'], shippingCostType: 'free' }),
    create: async () => { assert.fail('An invalid price must not create an order') },
  }
  const paypal = { isPayPalConfigured: () => true, paypalRequest: async () => { assert.fail('An invalid price must not reach PayPal') } }
  for (const path of ['app/api/checkout/quote/route.js', 'app/api/checkout/route.js']) {
    const response = await loadRoute(path, payload, { '@/lib/paypal': paypal }).POST(request({
      items: [{ productId: 1, quantity: 1 }], email: 'buyer@example.com',
      address: { fullName: 'Buyer', address1: 'Street 1', city: 'NY', postalCode: '10001', country: 'US' },
    }))
    assert.equal(response.status, 400)
    assert.match((await response.json()).error, /没有有效价格/)
  }
})
