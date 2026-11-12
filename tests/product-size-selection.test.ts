import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import * as jsxRuntime from 'react/jsx-runtime'
import ts from 'typescript'
import * as storefrontSeo from '../lib/storefront-seo.js'

const source = readFileSync(new URL('../app/(storefront)/product/[id]/ProductDetailClient.jsx', import.meta.url), 'utf8')
const serverSource = readFileSync(new URL('../app/(storefront)/product/[id]/page.jsx', import.meta.url), 'utf8')
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText

async function productPage(sizes = ['xs', 's', 'm'], query = '', outOfStock = false, serverRendered = false) {
  const variants = sizes.map((size) => ({ id: `variant-${size}`, length: 'short', shape: 'oval', size, enabled: true, trackStock: true, stock: outOfStock ? 0 : 10 }))
  const product = { _id: 'nails', name: 'Nails', image: [], variants }
  const state: any[] = []
  let cursor = 0
  const added: any[] = []
  const routes: string[] = []
  const imports: Record<string, any> = {
    'react/jsx-runtime': jsxRuntime,
    react: {
      useState: (initial: any) => {
        const index = cursor++
        if (!(index in state)) state[index] = initial
        return [state[index], (value: any) => { state[index] = value }]
      },
    },
    'next/navigation': { useParams: () => ({ id: 'nails' }) },
    '@/context/AppContext': { useAppContext: () => ({
      products: serverRendered ? [] : [product], productsStatus: serverRendered ? 'loading' : 'success', addToCart: (...args: any[]) => added.push(args), router: { push: (route: string) => routes.push(route) },
      shippingSettings: { freeShippingThreshold: 50 }, shippingEstimate: '12–25 days', siteSettings: { customerEmail: 'hello@example.com' },
    }) },
    '@/lib/format-dimension': { formatDimension: (value: string) => value },
    '@/lib/product-pricing': { getPriceDetails: () => ({ currentPrice: 20, price: 20 }) },
    '@/lib/product-size-order': { sortProductSizes: (values: string[]) => [...new Set(values)] },
    '@/lib/product-color': { productVariantAttributeKeys: () => [] },
  }
  const exports: any = {}
  runInNewContext(code, { exports, URLSearchParams, window: { location: { search: query }, setTimeout: () => 0 }, require: (name: string) => imports[name] || { __esModule: true, default: name } })
  const server = { exports: {} as any }
  const serverCode = ts.transpileModule(serverSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  runInNewContext(serverCode, { exports: server.exports, require: (name: string) => ({
    ...imports,
    react: { cache: (fn: Function) => fn },
    '@/lib/storefront-catalog': { getPublishedCatalog: async () => [{ ...product, id: 'nails', seoNoIndex: true }], getStorefrontMarketingSettings: async () => ({}) },
    '@/lib/storefront-product': { toStorefrontProduct: (item: unknown) => item },
    '@/lib/storefront-seo': storefrontSeo,
    './ProductDetailClient': { __esModule: true, default: exports.default },
  })[name] || {} })
  const result = await server.exports.default({ params: { id: 'nails' }, searchParams: Object.fromEntries(new URLSearchParams(query)) })
  const client = result.props.children.find((child: any) => child?.type === exports.default)
  return { tree: client.type(client.props), added, routes }

}

function elements(tree: any): any[] {
  if (!tree?.props) return []
  return [tree, ...[tree.props.children].flat(Infinity).flatMap(elements)]
}

test('default S is a real selected variant and both purchase actions can continue', async () => {
  const page = await productPage()
  const nodes = elements(page.tree)
  assert.equal(nodes.find((node) => node.props.ariaLabel === 'Choose size')?.props.value, 's')
  const cart = nodes.find((node) => node.type === 'button' && node.props.children === 'Add to cart')
  const buy = nodes.find((node) => node.type === 'button' && node.props.children === 'Buy now')
  assert.equal(cart.props.disabled, false)
  assert.equal(buy.props.disabled, false)
  cart.props.onClick()
  buy.props.onClick()
  assert.equal(page.added[0][1].id, 'variant-s')
  assert.equal(page.added[1][1].id, 'variant-s')
  assert.deepEqual(page.routes, ['/checkout'])
})

test('explicit variant links and products without S retain valid sizes', async () => {
  for (const [sizes, query, expected] of [[['xs', 's', 'm'], '?variant=variant-m', 'm'], [['xs', 'm'], '', 'xs']] as const) {
    const page = await productPage([...sizes], query)
    assert.equal(elements(page.tree).find((node) => node.props.ariaLabel === 'Choose size')?.props.value, expected)
  }
})

test('a selected out-of-stock size still prevents purchase', async () => {
  const nodes = elements((await productPage(['s'], '', true)).tree)
  assert.equal(nodes.find((node) => node.type === 'button' && node.props.children === 'Out of stock')?.props.disabled, true)
  assert.equal(nodes.find((node) => node.type === 'button' && node.props.children === 'Buy now')?.props.disabled, true)
})


test('a server-provided product renders before the browser catalogue finishes loading', async () => {
  const page = await productPage(['s'], '', false, true)
  const nodes = elements(page.tree)
  assert.ok(nodes.some((node) => node.type === 'button' && node.props.children === 'Add to cart'))
  assert.ok(!nodes.some((node) => node.props.children === 'Loading designs…'))
})
