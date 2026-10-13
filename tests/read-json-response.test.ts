import assert from 'node:assert/strict'
import test from 'node:test'
import { readJSONResponse } from '../lib/read-json-response'

test('parses successful JSON response', async () => {
  assert.deepEqual(await readJSONResponse(new Response('{"id":1}')), { id: 1 })
})

test('reports empty or malformed JSON response clearly', async () => {
  await assert.rejects(readJSONResponse(new Response('', { status: 200 })), /invalid response \(200\)/)
  await assert.rejects(readJSONResponse(new Response('<html>', { status: 502 })), /invalid response \(502\)/)
})

test('uses server error from JSON response', async () => {
  await assert.rejects(readJSONResponse(new Response('{"error":"Publish validation failed."}', { status: 400 })), /Publish validation failed/)
})
