import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { BasePayload, buildConfig } from 'payload'
import ts from 'typescript'
import { Customers } from '../collections/Customers'
import { Users } from '../collections/Users'
import { Orders } from '../collections/Orders'
import { isAdminUser, restrictDocumentLocksToAdmins } from '../lib/admin-access'
import * as customerSession from '../lib/customer-session'
import { verifyWordPressPassword } from '../lib/legacy-customer-password'

// Synthetic fixture generated independently with PHP's WordPress HMAC + password_hash.
const legacyPassword = 'Migrated-Customer-Only-123'
const legacyHash = '$wp$2y$04$TCpFzEP16hKe9VkiEca8K.SfuIHISPQmefRnc5CscohGIXwoAji3W'

function loadRoute(path: string, payload: unknown) {
  const code = ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const modules: Record<string, unknown> = {
    payload: { getPayload: async () => payload },
    '@payload-config': { default: {} },
    '@/lib/customer-session': customerSession,
  }
  const exports: any = {}
  runInNewContext(code, { exports, Response, Headers, URL, Buffer, Error, require: (name: string) => {
    assert.ok(name in modules, `Unmocked dependency: ${name}`)
    return modules[name]
  } })
  return exports
}

function request(method: string, body?: unknown, cookie = '', origin = 'https://shop.example') {
  return new Request('https://shop.example/api/customer/session', {
    method, headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: cookie },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}

test('WordPress verifier accepts a PHP-generated hash and rejects wrong or unsupported credentials', async () => {
  assert.equal(await verifyWordPressPassword(legacyPassword, legacyHash), true)
  assert.equal(await verifyWordPressPassword('wrong', legacyHash), false)
  assert.equal(await verifyWordPressPassword(legacyPassword, '$P$unsupported'), false)
  assert.equal(await verifyWordPressPassword(legacyPassword, legacyHash.replace('$04$', '$31$')), false)
  assert.equal(await verifyWordPressPassword('x'.repeat(4097), legacyHash), false)
})

test('isolated Payload customer login, legacy upgrade, sessions, orders and administrator separation', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'quickcart-customers-'))
  const payload = new BasePayload()
  try {
    await payload.init({ config: buildConfig({
      secret: randomBytes(32).toString('hex'),
      admin: { user: 'users', importMap: { autoGenerate: false } },
      typescript: { autoGenerate: false },
      db: sqliteAdapter({ client: { url: `file:${join(directory, 'test.sqlite')}` } }),
      collections: [Users, Customers, Orders, { slug: 'products', fields: [{ name: 'title', type: 'text' }] }],
    }).then(restrictDocumentLocksToAdmins) })
    const nativePassword = 'Native-Customer-Only-123'
    const customer = await payload.create({ collection: 'customers', data: { email: 'customer@example.test', fullName: 'Test Customer', password: nativePassword }, overrideAccess: true })
    const legacy = await payload.create({ collection: 'customers', data: { email: 'legacy@example.test', password: randomBytes(32).toString('hex'), legacyPasswordHash: legacyHash, legacyWordpressID: '123' }, overrideAccess: true })
    const admin = await payload.create({ collection: 'users', data: { email: 'admin@example.test', password: nativePassword }, overrideAccess: true })
    const session = loadRoute('app/api/customer/session/route.ts', payload)
    const login = (email: string, password: string) => session.POST(request('POST', { email, password }))
    const rawLegacy = () => payload.findByID({ collection: 'customers', id: legacy.id, showHiddenFields: true, overrideAccess: true })

    await t.test('public signup and customer writes to administrator accounts are denied', async () => {
      const firstRegister = (payload.collections.customers.config.endpoints as any[]).find((endpoint) => endpoint.path === '/first-register' && endpoint.method === 'post')
      assert.equal((await firstRegister.handler()).status, 403)
      await assert.rejects(() => payload.create({ collection: 'customers', data: { email: 'unauthorized@example.test', password: nativePassword }, overrideAccess: false }))
      await assert.rejects(() => payload.find({ collection: 'users', overrideAccess: false, user: { ...customer, collection: 'customers' } }))
      await assert.rejects(() => payload.update({ collection: 'users', id: admin.id, data: { email: 'changed@example.test' }, overrideAccess: false, user: { ...customer, collection: 'customers' } }))
      await assert.rejects(() => payload.find({ collection: 'payload-locked-documents', overrideAccess: false, user: { ...customer, collection: 'customers' } }))
    })

    await t.test('cross-origin and malformed requests are denied', async () => {
      assert.equal((await session.POST(request('POST', { email: customer.email, password: nativePassword }, '', 'https://other.example'))).status, 403)
      assert.equal((await login(customer.email, 'x'.repeat(4097))).status, 400)
    })

    await t.test('wrong password and unknown email have the same generic error', async () => {
      const wrong = await login(legacy.email, 'wrong-password')
      const unknown = await login('nobody@example.test', 'wrong-password')
      assert.equal(wrong.status, 401)
      assert.deepEqual(await wrong.json(), await unknown.json())
      assert.equal((await rawLegacy()).legacyPasswordHash, legacyHash)
      assert.equal((await rawLegacy()).loginAttempts, 1)
    })

    let cookie: string
    await t.test('successful first login upgrades the hash without exposing secrets or affecting admin cookies', async () => {
      const response = await login(' LEGACY@example.test ', legacyPassword)
      assert.equal(response.status, 200)
      cookie = response.headers.get('Set-Cookie')!.split(';')[0]
      assert.match(cookie, /^ginny-customer-token=/)
      assert.match(response.headers.get('Set-Cookie')!, /HttpOnly/)
      assert.match(response.headers.get('Set-Cookie')!, /SameSite=Lax/)
      assert.equal(response.headers.get('Cache-Control'), 'private, no-store')
      const body = await response.json()
      assert.deepEqual(Object.keys(body.customer).sort(), ['email', 'fullName', 'id'])
      assert.equal('token' in body, false)
      const stored = await rawLegacy()
      assert.equal(stored.legacyPasswordHash, null)
      assert.match(stored.hash!, /^pbkdf2-sha256-v1:/)
      assert.ok((await payload.login({ collection: 'customers', data: { email: legacy.email, password: legacyPassword } })).token)
      assert.equal((await customerSession.getCustomerSession(payload, new Headers({ Cookie: cookie })))?.email, legacy.email)
      const adminLogin = await payload.login({ collection: 'users', data: { email: admin.email, password: nativePassword } })
      assert.equal(await customerSession.getCustomerSession(payload, new Headers({ Cookie: `payload-token=${adminLogin.token}` })), null)
      assert.equal(await customerSession.getCustomerSession(payload, new Headers({ Cookie: `ginny-customer-token=${adminLogin.token}` })), null)
    })

    await t.test('customer API reads only the signed-in email, regardless of supplied filters', async () => {
      const product = await payload.create({ collection: 'products', data: { title: 'Test Design' } as never })
      for (const [email, number] of [[legacy.email, 'WOO-1'], [customer.email, 'WOO-2']]) {
        await payload.create({ collection: 'orders', data: {
          orderNumber: number, customerEmail: email, currency: 'USD', subtotal: 20, total: 20,
          shippingTotal: 0, taxTotal: 0, discountTotal: 0, paymentStatus: 'paid', fulfillmentStatus: 'delivered',
          items: [{ product: product.id, title: 'Test Design', quantity: 1, unitPrice: 20 }],
          shippingAddress: { fullName: 'Test Customer', address1: 'Test Street', city: 'Test City', postalCode: '00000', country: 'US' },
        } })
      }
      const orders = loadRoute('app/api/customer/orders/route.ts', payload)
      assert.equal((await orders.GET(request('GET'))).status, 401)
      const response = await orders.GET(new Request(`https://shop.example/api/customer/orders?email=${customer.email}`, { headers: { Cookie: cookie } }))
      const result = await response.json()
      assert.deepEqual(result.docs.map((order: any) => order.orderNumber), ['WOO-1'])
      assert.equal('shippingAddress' in result.docs[0], false)
      assert.equal('customerEmail' in result.docs[0], false)
    })

    await t.test('logout revokes the server session and clears only the customer cookie', async () => {
      const response = await session.DELETE(request('DELETE', undefined, cookie))
      assert.equal(response.status, 200)
      assert.match(response.headers.get('Set-Cookie')!, /^ginny-customer-token=/)
      assert.equal(await customerSession.getCustomerSession(payload, new Headers({ Cookie: cookie })), null)
      assert.equal((await session.GET(request('GET'))).status, 200)
    })

    await t.test('locked migrated account cannot upgrade its password', async () => {
      const locked = await payload.create({ collection: 'customers', data: { email: 'locked@example.test', password: nativePassword, legacyPasswordHash: legacyHash } })
      for (let attempt = 0; attempt < 5; attempt++) assert.equal((await login(locked.email, 'wrong-password')).status, 401)
      assert.equal((await login(locked.email, legacyPassword)).status, 401)
      const stored = await payload.findByID({ collection: 'customers', id: locked.id, showHiddenFields: true })
      assert.equal(stored.legacyPasswordHash, legacyHash)
      assert.ok(new Date(stored.lockUntil!).getTime() > Date.now())
      await payload.update({ collection: 'customers', id: locked.id, data: { password: 'New-Password-Only-123', loginAttempts: 0, lockUntil: null } })
      assert.equal((await payload.findByID({ collection: 'customers', id: locked.id, showHiddenFields: true })).legacyPasswordHash, null)
      assert.equal((await login(locked.email, legacyPassword)).status, 401)
      assert.equal((await login(locked.email, 'New-Password-Only-123')).status, 200)
    })
  } finally {
    await payload.destroy()
    await rm(directory, { recursive: true, force: true })
  }
})

test('only the Users collection represents an administrator', () => {
  assert.equal(isAdminUser({ collection: 'customers' }), false)
  assert.equal(isAdminUser({ collection: 'users' }), true)
  assert.equal(isAdminUser(null), false)
  assert.equal(isAdminUser({}), false)
})
