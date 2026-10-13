import { afterEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { getPayPalPublicConfig } from '../lib/paypal.js'

const original = {
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  environment: process.env.PAYPAL_ENV,
  cards: process.env.PAYPAL_CARD_PAYMENTS_ENABLED,
}

afterEach(() => {
  if (original.clientId === undefined) delete process.env.PAYPAL_CLIENT_ID
  else process.env.PAYPAL_CLIENT_ID = original.clientId
  if (original.clientSecret === undefined) delete process.env.PAYPAL_CLIENT_SECRET
  else process.env.PAYPAL_CLIENT_SECRET = original.clientSecret
  if (original.environment === undefined) delete process.env.PAYPAL_ENV
  else process.env.PAYPAL_ENV = original.environment
  if (original.cards === undefined) delete process.env.PAYPAL_CARD_PAYMENTS_ENABLED
  else process.env.PAYPAL_CARD_PAYMENTS_ENABLED = original.cards
})

test('public PayPal config exposes only the client ID and hides card brands until enabled', () => {
  process.env.PAYPAL_CLIENT_ID = 'public-client-id'
  process.env.PAYPAL_CLIENT_SECRET = 'must-not-be-exposed'
  process.env.PAYPAL_ENV = 'live'
  delete process.env.PAYPAL_CARD_PAYMENTS_ENABLED

  assert.deepEqual(getPayPalPublicConfig(), {
    clientId: 'public-client-id',
    environment: 'production',
    cardPaymentsEnabled: false,
  })
  assert.equal(JSON.stringify(getPayPalPublicConfig()).includes('must-not-be-exposed'), false)

  process.env.PAYPAL_CARD_PAYMENTS_ENABLED = 'true'
  assert.equal(getPayPalPublicConfig().cardPaymentsEnabled, true)

  delete process.env.PAYPAL_CLIENT_SECRET
  assert.equal(getPayPalPublicConfig().cardPaymentsEnabled, false)
})
