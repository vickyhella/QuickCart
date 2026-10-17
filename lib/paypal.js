import { getEnvironmentVariable } from './environment-config'

const getApiRoot = () => getEnvironmentVariable('PAYPAL_ENV') === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

export function isPayPalConfigured() {
  return Boolean(getEnvironmentVariable('PAYPAL_CLIENT_ID') && getEnvironmentVariable('PAYPAL_CLIENT_SECRET'))
}

export function getPayPalPublicConfig() {
  const live = getEnvironmentVariable('PAYPAL_ENV') === 'live'
  return {
    clientId: getEnvironmentVariable('PAYPAL_CLIENT_ID') || '',
    environment: live ? 'production' : 'sandbox',
    cardPaymentsEnabled: isPayPalConfigured() && getEnvironmentVariable('PAYPAL_CARD_PAYMENTS_ENABLED') === 'true',
  }
}

export async function getPayPalAccessToken() {
  if (!isPayPalConfigured()) throw new Error('PayPal is not configured')
  const credentials = Buffer.from(`${getEnvironmentVariable('PAYPAL_CLIENT_ID')}:${getEnvironmentVariable('PAYPAL_CLIENT_SECRET')}`).toString('base64')
  const response = await fetch(`${getApiRoot()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })
  const result = await response.json()
  if (!response.ok || !result.access_token) throw new Error(result.error_description || 'Unable to authenticate with PayPal')
  return result.access_token
}

export async function paypalRequest(path, { method = 'GET', body, requestId } = {}) {
  const accessToken = await getPayPalAccessToken()
  const response = await fetch(`${getApiRoot()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(requestId ? { 'PayPal-Request-Id': requestId } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(result.message || 'PayPal request failed')
    error.details = result
    error.status = response.status
    throw error
  }
  return result
}
