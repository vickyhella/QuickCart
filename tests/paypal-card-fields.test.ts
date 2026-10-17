import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'
import { setImmediate } from 'node:timers/promises'
import ts from 'typescript'

// Exercise SDK callbacks without credentials or sending card details to a real provider.
function mount({ eligible = true, valid = true, captureOK = true, disabled = false } = {}) {
  const effects: Array<() => unknown> = []
  const states: unknown[] = []
  const busy: boolean[] = []
  const errors: string[] = []
  const requests: Array<{ url: string; body: string }> = []
  const locations: string[] = []
  let options: any
  let closed = 0
  let rendered = 0
  let submitted = 0
  const script: any = { dataset: { loaded: 'true' }, addEventListener() {}, removeEventListener() {}, remove() {} }
  script.src = 'https://www.paypal.com/sdk/js?client-id=test&currency=USD&intent=capture&components=card-fields'
  const sdk = {
    isEligible: () => eligible,
    getState: async () => ({ isFormValid: valid }),
    submit: async () => {
      submitted++
      const orderID = await options.createOrder()
      await options.onApprove({ orderID })
    },
    ...Object.fromEntries(['NameField', 'NumberField', 'ExpiryField', 'CVVField'].map((name) => [name, () => ({ render: async () => { rendered++ }, close: () => { closed++ } })])),
  }
  const jsx = (type: string, props: any) => {
    if (props?.ref) props.ref.current = { children: Array.from({ length: 4 }, () => ({ lastElementChild: {} })) }
    return { type, props }
  }
  const exports: any = {}
  const compiled = ts.transpileModule(readFileSync(new URL('../components/PayPalCardButton.jsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, allowJs: true }, fileName: 'PayPalCardButton.jsx',
  }).outputText
  runInNewContext(compiled, {
    exports,
    require: (name: string) => name === 'react' ? {
      useRef: (current: unknown) => ({ current }),
      useState: () => ['loading', (state: unknown) => states.push(state)],
      useEffect: (effect: () => unknown) => effects.push(effect),
    } : { jsx, jsxs: jsx },
    window: { paypal: { CardFields: (value: unknown) => { options = value; return sdk } }, location: { assign: (value: string) => locations.push(value) } },
    document: { getElementById: () => script },
    fetch: async (url: string, request: { body: string }) => {
      requests.push({ url, body: request.body })
      return { ok: captureOK, json: async () => captureOK ? { orderNumber: 'GN-TEST' } : { error: 'Check your order before retrying.' } }
    },
  })
  const tree = exports.default({ clientId: 'test', currency: 'USD', disabled, createOrder: async () => 'PAYPAL123', onBusy: (value: boolean) => busy.push(value), onError: (value: string) => errors.push(value) })
  const cleanups = effects.map((effect) => effect())
  function findButton(node: any): any {
    if (!node || typeof node !== 'object') return
    if (node.type === 'button') return node
    for (const child of [node.props?.children].flat()) {
      const result = findButton(child)
      if (result) return result
    }
  }
  return { states, busy, errors, requests, locations, options, submit: () => findButton(tree).props.onClick(), counts: () => ({ closed, rendered, submitted }), unmount: () => cleanups.forEach((cleanup) => { if (typeof cleanup === 'function') cleanup() }) }
}

test('eligible cards render four hosted fields, capture on the server and navigate after success', async () => {
  const ui = mount()
  await setImmediate()
  assert.ok(ui.states.includes('ready'))
  await ui.submit()
  assert.deepEqual(ui.requests, [{ url: '/api/checkout/paypal-capture', body: '{"orderId":"PAYPAL123"}' }])
  assert.deepEqual(ui.locations, ['/order-placed?orderNumber=GN-TEST'])
  await ui.submit()
  assert.equal(ui.counts().submitted, 1)
  ui.unmount()
  assert.equal(ui.counts().closed, 4)
})

test('ineligible cards keep the PayPal fallback and never render card inputs', () => {
  const ui = mount({ eligible: false })
  assert.ok(ui.states.includes('unavailable'))
  assert.equal(ui.counts().rendered, 0)
})

test('invalid or disabled cards do not create a payment', async () => {
  const invalid = mount({ valid: false })
  await invalid.submit()
  assert.equal(invalid.counts().submitted, 0)
  assert.equal(invalid.busy.at(-1), false)
  assert.match(invalid.errors.at(-1)!, /check your card/i)
  const disabled = mount({ disabled: true })
  await disabled.submit()
  assert.equal(disabled.counts().submitted, 0)
})

test('uncertain capture stays locked and never redirects or creates another payment', async () => {
  const ui = mount({ captureOK: false })
  await ui.submit()
  ui.options.onError({})
  await ui.submit()
  assert.equal(ui.busy.at(-1), true)
  assert.equal(ui.counts().submitted, 1)
  assert.equal(ui.locations.length, 0)
  assert.match(ui.errors.at(-1)!, /check your order/i)
})
