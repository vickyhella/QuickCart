import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'
import ts from 'typescript'
import { isAdminUser } from '../lib/admin-access'
import { Users } from '../collections/Users'
import { Customers } from '../collections/Customers'
import { ContactMessages } from '../collections/ContactMessages'
import { Discounts } from '../collections/Discounts'
import { Orders } from '../collections/Orders'
import { Products } from '../collections/Products'
import { Pages } from '../collections/Pages'
import { Suppliers } from '../collections/Suppliers'
import { PinterestPosts } from '../collections/PinterestPosts'
import { MarketingWorkspace } from '../collections/MarketingWorkspace'
import { Media } from '../collections/Media'
import { MediaOriginals } from '../collections/MediaOriginals'
import { StoreSettings } from '../globals/StoreSettings'
import { MarketingSettings } from '../globals/MarketingSettings'
import { ProductDimensions } from '../globals/ProductDimensions'
import * as productDimensionOptions from '../lib/product-dimensions'

const customer = { id: 1, collection: 'customers' }
const admin = { id: 1, collection: 'users' }

test('customers cannot mutate or read internal collections/globals, including a matching admin ID', async () => {
  for (const config of [Users, ContactMessages, Discounts, Orders, Suppliers, PinterestPosts, MarketingWorkspace, MediaOriginals, StoreSettings, MarketingSettings, ProductDimensions]) {
    for (const action of ['read', 'create', 'update', 'delete']) {
      const access = (config.access as any)?.[action]
      if (access) assert.equal(await access({ req: { user: customer } }), false, `${config.slug}.${action}`)
    }
  }
  for (const config of [Products, Pages]) {
    assert.deepEqual(await (config.access!.read as any)({ req: { user: customer } }), { status: { equals: 'published' } })
    assert.equal(await (config.access!.read as any)({ req: { user: admin } }), true)
  }
  for (const config of [Products, Pages, Media]) {
    for (const action of ['create', 'update']) assert.equal(await (config.access![action] as any)({ req: { user: customer } }), false)
  }
  assert.equal(await (Customers.access!.admin as any)({ req: { user: customer } }), false)
  assert.deepEqual(await (Customers.access!.read as any)({ req: { user: customer } }), { id: { equals: 1 } })
  assert.equal(await (Users.access!.admin as any)({ req: { user: admin } }), true)
})

test('customer product responses hide supplier information and only allow published media', async () => {
  const doc = { id: 1, title: 'Public', chineseName: 'Internal', purchaseURL: 'https://private.example', suppliers: [1] }
  const publicDoc = await (Products.hooks!.afterRead![0] as any)({ doc, req: { user: customer } })
  assert.deepEqual(publicDoc, { id: 1, title: 'Public' })
  let query: any
  const access = await (Media.access!.read as any)({ req: { user: customer, payload: { findGlobal: async () => ({}), find: async (args: any) => { query = args; return { docs: [{ featuredImage: 3 }] } } } } })
  assert.deepEqual(query.where, { status: { equals: 'published' } })
  assert.deepEqual(access, { id: { in: ['3'] } })
})

test('every protected custom admin handler rejects a real customer identity before accessing data', async () => {
  const root = new URL('../app/api/', import.meta.url).pathname
  const files = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)])
  const protectedRoutes = files(root).filter((path) => path.endsWith('/route.ts') && readFileSync(path, 'utf8').includes('isAdminUser(user)'))
  assert.ok(protectedRoutes.length >= 20)
  let checked = 0
  for (const path of protectedRoutes) {
    const source = readFileSync(path, 'utf8')
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
    const exports: any = {}
    const payload = { auth: async () => ({ user: customer }) }
    const unusedDependency = new Proxy({}, { get: () => () => { throw new Error('Protected handler accessed a dependency before authorization') } })
    runInNewContext(code, { exports, Response, Request, Headers, URL, process, Buffer, console, require: (name: string) => {
      if (name === '@/lib/admin-access') return { isAdminUser }
      if (name === '@/lib/product-dimensions') return productDimensionOptions
      if (name === 'payload') return { getPayload: async () => payload }
      if (name === 'next/server') return { NextResponse: { json: Response.json.bind(Response) } }
      if (name === '@payloadcms/next/routes') return { REST_GET: () => async () => new Response(null, { status: 401 }) }
      if (name === '@payload-config' || name === '@/payload.config') return { default: {} }
      return unusedDependency
    } }, { filename: path })
    for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
      if (!exports[method]) continue
      const response = await exports[method](new Request('https://shop.example/api/test', { method, headers: { Origin: 'https://shop.example' } }), { params: Promise.resolve({ id: '1' }) })
      assert.equal(response.status, 401, `${path} ${method}`)
      checked++
    }
  }
  assert.ok(checked >= 29)
})
