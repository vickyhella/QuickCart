import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assertPayPalOrderMatches, capturePayPalOrder } from '../lib/paypal-order.js'

const localOrder = () => ({ id: 12, orderNumber: 'GN-TEST', paymentReference: 'PAYPAL123', currency: 'USD', total: 25.5, paymentStatus: 'pending', items: [] })
const remoteOrder = (completed = false) => ({
  id: 'PAYPAL123',
  status: completed ? 'COMPLETED' : 'APPROVED',
  purchase_units: [{
    custom_id: '12',
    amount: { currency_code: 'USD', value: '25.50' },
    ...(completed ? { payments: { captures: [{ status: 'COMPLETED', amount: { currency_code: 'USD', value: '25.50' } }] } } : {}),
  }],
})

test('payment matching rejects mismatched references, local IDs, amounts and currencies', () => {
  assert.doesNotThrow(() => assertPayPalOrderMatches(localOrder(), remoteOrder()))
  for (const change of [{ paymentReference: 'OTHER' }, { id: 13 }, { total: 1 }, { currency: 'EUR' }]) {
    assert.throws(() => assertPayPalOrderMatches({ ...localOrder(), ...change }, remoteOrder()))
  }
  assert.throws(() => assertPayPalOrderMatches(localOrder(), { ...remoteOrder(), purchase_units: [] }))
  assert.throws(() => assertPayPalOrderMatches(localOrder(), { ...remoteOrder(), purchase_units: [...remoteOrder().purchase_units, ...remoteOrder().purchase_units] }))
})

test('completed status alone cannot settle a pending, missing or wrong-amount capture', () => {
  assert.doesNotThrow(() => assertPayPalOrderMatches(localOrder(), remoteOrder(true), true))
  const pending = remoteOrder(true)
  pending.purchase_units[0].payments!.captures[0].status = 'PENDING'
  assert.throws(() => assertPayPalOrderMatches(localOrder(), pending, true))
  const wrongAmount = remoteOrder(true)
  wrongAmount.purchase_units[0].payments!.captures[0].amount.value = '1.00'
  assert.throws(() => assertPayPalOrderMatches(localOrder(), wrongAmount, true))
  assert.throws(() => assertPayPalOrderMatches(localOrder(), { ...remoteOrder(), status: 'COMPLETED' }, true))
})

test('capture verifies payment and uses a stable idempotency key; sequential retries do not settle twice', async () => {
  let order = localOrder()
  let updates = 0
  let captures = 0
  const payload = {
    findByID: async () => order,
    update: async ({ data }: { data: object }) => { updates++; order = { ...order, ...data }; return order },
  }
  const requestPayPal = async (path: string, options?: { requestId: string }) => {
    if (path.endsWith('/capture')) {
      captures++
      assert.equal(options?.requestId, 'capture-PAYPAL123')
      return remoteOrder(true)
    }
    return remoteOrder(captures > 0)
  }
  assert.equal((await capturePayPalOrder(payload, 'PAYPAL123', requestPayPal)).paymentStatus, 'paid')
  await capturePayPalOrder(payload, 'PAYPAL123', requestPayPal)
  assert.equal(captures, 1)
  assert.equal(updates, 1)
})

test('mismatched orders fail before capture or local writes', async () => {
  let requests = 0
  await assert.rejects(capturePayPalOrder({
    findByID: async () => ({ ...localOrder(), total: 99 }),
    update: async () => assert.fail('must not write'),
  }, 'PAYPAL123', async () => { requests++; return remoteOrder() }))
  assert.equal(requests, 1)
})

test('pending capture never marks an order paid', async () => {
  await assert.rejects(capturePayPalOrder({
    findByID: async () => localOrder(),
    update: async () => assert.fail('must not write'),
  }, 'PAYPAL123', async (path: string) => {
    if (!path.endsWith('/capture')) return remoteOrder()
    const result = remoteOrder(true)
    result.purchase_units[0].payments!.captures[0].status = 'PENDING'
    return result
  }))
})

test('already captured remote payment can recover a missed return without charging again', async () => {
  let requests = 0
  const order = localOrder()
  const result = await capturePayPalOrder({
    findByID: async () => order,
    update: async ({ data }: { data: object }) => ({ ...order, ...data }),
  }, 'PAYPAL123', async () => { requests++; return remoteOrder(true) })
  assert.equal(result.paymentStatus, 'paid')
  assert.equal(requests, 1)
})
