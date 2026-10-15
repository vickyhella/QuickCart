import { afterEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { getPayPalPublicConfig } from '../lib/paypal.js'

const env = process.env as unknown as Record<string, string | undefined>
const original = {
  nodeEnv: env.NODE_ENV,
  productionClientId: env.PAYPAL_CLIENT_ID,
  productionClientSecret: env.PAYPAL_CLIENT_SECRET,
  productionEnvironment: env.PAYPAL_ENV,
  productionCards: env.PAYPAL_CARD_PAYMENTS_ENABLED,
  clientId: env.PAYPAL_CLIENT_ID_DEVELOPMENT,
  clientSecret: env.PAYPAL_CLIENT_SECRET_DEVELOPMENT,
  environment: env.PAYPAL_ENV_DEVELOPMENT,
  cards: env.PAYPAL_CARD_PAYMENTS_ENABLED_DEVELOPMENT,
}

afterEach(() => {
  if (original.nodeEnv === undefined) delete env.NODE_ENV
  else env.NODE_ENV = original.nodeEnv
  if (original.productionClientId === undefined) delete env.PAYPAL_CLIENT_ID
  else env.PAYPAL_CLIENT_ID = original.productionClientId
  if (original.productionClientSecret === undefined) delete env.PAYPAL_CLIENT_SECRET
  else env.PAYPAL_CLIENT_SECRET = original.productionClientSecret
  if (original.productionEnvironment === undefined) delete env.PAYPAL_ENV
  else env.PAYPAL_ENV = original.productionEnvironment
  if (original.productionCards === undefined) delete env.PAYPAL_CARD_PAYMENTS_ENABLED
  else env.PAYPAL_CARD_PAYMENTS_ENABLED = original.productionCards
  if (original.clientId === undefined) delete env.PAYPAL_CLIENT_ID_DEVELOPMENT
  else env.PAYPAL_CLIENT_ID_DEVELOPMENT = original.clientId
  if (original.clientSecret === undefined) delete env.PAYPAL_CLIENT_SECRET_DEVELOPMENT
  else env.PAYPAL_CLIENT_SECRET_DEVELOPMENT = original.clientSecret
  if (original.environment === undefined) delete env.PAYPAL_ENV_DEVELOPMENT
  else env.PAYPAL_ENV_DEVELOPMENT = original.environment
  if (original.cards === undefined) delete env.PAYPAL_CARD_PAYMENTS_ENABLED_DEVELOPMENT
  else env.PAYPAL_CARD_PAYMENTS_ENABLED_DEVELOPMENT = original.cards
})

test('public PayPal config exposes only the client ID and hides card brands until enabled', () => {
  env.NODE_ENV = 'development'
  env.PAYPAL_CLIENT_ID = 'production-client-id'
  env.PAYPAL_CLIENT_SECRET = 'production-secret'
  env.PAYPAL_ENV = 'live'
  env.PAYPAL_CARD_PAYMENTS_ENABLED = 'true'
  env.PAYPAL_CLIENT_ID_DEVELOPMENT = 'public-client-id'
  env.PAYPAL_CLIENT_SECRET_DEVELOPMENT = 'must-not-be-exposed'
  env.PAYPAL_ENV_DEVELOPMENT = 'live'
  delete env.PAYPAL_CARD_PAYMENTS_ENABLED_DEVELOPMENT

  assert.deepEqual(getPayPalPublicConfig(), {
    clientId: 'public-client-id',
    environment: 'production',
    cardPaymentsEnabled: false,
  })
  assert.equal(JSON.stringify(getPayPalPublicConfig()).includes('must-not-be-exposed'), false)

  env.PAYPAL_CARD_PAYMENTS_ENABLED_DEVELOPMENT = 'true'
  assert.equal(getPayPalPublicConfig().cardPaymentsEnabled, true)

  delete env.PAYPAL_CLIENT_SECRET_DEVELOPMENT
  assert.equal(getPayPalPublicConfig().cardPaymentsEnabled, false)
})
