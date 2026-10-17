import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'
import ts from 'typescript'

async function checkout({ card = true, enabled = true, approval = false } = {}) {
  const created: any[] = []
  const paypalBodies: any[] = []
  const exports: any = {}
  const payload = {
    findGlobal: async ({ slug }: { slug: string }) => slug === 'store-settings' ? { currency: 'USD' } : { availableCountries: ['US'] },
    findByID: async () => ({ id: 1, title: 'Product', status: 'published', variants: [] }),
    create: async ({ data }: { data: any }) => { created.push(data); return { id: 12, ...data } },
    update: async () => ({}),
  }
  const imports: Record<string, any> = {
    'next/server': { NextResponse: { json: (body: unknown, options?: { status: number }) => ({ body, status: options?.status || 200 }) } },
    'node:crypto': { randomBytes },
    payload: { getPayload: async () => payload },
    '@/payload.config': { default: {} },
    '@/lib/checkout-error': { getCheckoutFailure: () => ({ message: 'Checkout failed', status: 400 }) },
    '@/lib/paypal': {
      isPayPalConfigured: () => true,
      getPayPalPublicConfig: () => ({ cardPaymentsEnabled: enabled }),
      paypalRequest: async (_path: string, { body }: { body: any }) => {
        paypalBodies.push(body)
        return { id: 'PAYPAL123', links: approval ? [{ rel: 'approve', href: 'https://www.paypal.com/checkoutnow?token=PAYPAL123' }] : [] }
      },
    },
    '@/lib/countries': { shippingCountries: [['US', 'United States']] },
    '@/lib/shipping-tiers': { calculateShippingCharge: () => ({ shippingTotal: 5 }) },
    '@/lib/product-pricing': { getPriceDetails: () => ({ currentPrice: 20 }) },
  }
  const compiled = ts.transpileModule(readFileSync(new URL('../app/api/checkout/route.js', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, allowJs: true }, fileName: 'route.js',
  }).outputText
  runInNewContext(compiled, { exports, require: (name: string) => imports[name], URL, console: { error() {} } })
  const response = await exports.POST({
    url: 'https://shop.example/api/checkout',
    json: async () => ({
      ...(card ? { paymentMethod: 'card' } : {}),
      email: 'buyer@example.com', total: 0.01,
      address: { fullName: 'Buyer', address1: '1 Main St', city: 'New York', postalCode: '10001', country: 'US' },
      items: [{ productId: 1, quantity: 1, unitPrice: 0.01 }],
    }),
  })
  return { response, created, paypalBodies }
}

test('advanced card order requires no approval link and uses server prices with 3DS verification', async () => {
  const { response, created, paypalBodies } = await checkout()
  assert.equal(response.status, 200)
  assert.equal(response.body.orderId, 'PAYPAL123')
  assert.equal(created[0].total, 25)
  assert.equal(paypalBodies[0].purchase_units[0].amount.value, '25.00')
  assert.equal(paypalBodies[0].payment_source.card.attributes.verification.method, 'SCA_WHEN_REQUIRED')
})

test('disabled card payments reject before creating local or PayPal orders', async () => {
  const result = await checkout({ enabled: false })
  assert.equal(result.response.status, 503)
  assert.equal(result.created.length, 0)
  assert.equal(result.paypalBodies.length, 0)
})

test('standard PayPal retains approval URL and does not request card verification', async () => {
  const { response, paypalBodies } = await checkout({ card: false, approval: true })
  assert.equal(response.status, 200)
  assert.match(response.body.approvalURL, /^https:\/\/www.paypal.com\//)
  assert.equal(paypalBodies[0].payment_source, undefined)
  assert.equal((await checkout({ card: false })).response.status, 400)
})
