import test from 'node:test'
import assert from 'node:assert/strict'
import { getCheckoutFailure } from '../lib/checkout-error.js'

test('hides database query details from checkout responses', () => {
  assert.deepEqual(getCheckoutFailure(new Error('Failed query: select * from store_settings'), 'fallback'), {
    message: '暂时无法处理结账，请稍后重试。',
    status: 500,
    internal: true,
  })
})

test('preserves actionable checkout validation messages', () => {
  assert.deepEqual(getCheckoutFailure(new Error('购物车为空。'), 'fallback'), {
    message: '购物车为空。',
    status: 400,
    internal: false,
  })
})
