import assert from 'node:assert/strict'
import test from 'node:test'
import { migrationEnvironment } from '../scripts/migrate-database.mjs'

const required = {
  DATABASE_URL: 'postgresql://test:password@production.example/db',
  PAYLOAD_SECRET: 'secret', R2_BUCKET: 'bucket', R2_ENDPOINT: 'https://r2.example',
  R2_ACCESS_KEY_ID: 'access', R2_SECRET_ACCESS_KEY: 'secret', R2_PUBLIC_URL: 'https://media.example',
}
const preview = Object.fromEntries(Object.entries(required).map(([key, value]) => [`${key}_PREVIEW`, value]))

test('preview migration overrides inherited production selectors', () => {
  const env = migrationEnvironment('preview', preview, { NODE_ENV: 'development', VERCEL_ENV: 'production', QUICKCART_ENVIRONMENT: 'production' })
  assert.equal(env.NODE_ENV, 'production')
  assert.equal(env.VERCEL_ENV, 'preview')
  assert.equal(env.QUICKCART_ENVIRONMENT, 'preview')
})

test('missing preview credentials cannot fall back to production or inherited values', () => {
  assert.throws(() => migrationEnvironment('preview', required, preview), /Missing required preview/)
  const incomplete = { ...preview }
  delete incomplete.DATABASE_URL_PREVIEW
  assert.throws(() => migrationEnvironment('preview', incomplete, preview), /DATABASE_URL_PREVIEW/)
})

test('production requires its own unsuffixed settings', () => {
  assert.throws(() => migrationEnvironment('production', preview, required), /Missing required production/)
  assert.equal(migrationEnvironment('production', required).VERCEL_ENV, 'production')
})

test('invalid environment and non-PostgreSQL targets fail before spawning Payload', () => {
  assert.throws(() => migrationEnvironment('dev', preview), /explicitly/)
  assert.throws(() => migrationEnvironment('preview', { ...preview, DATABASE_URL_PREVIEW: 'file:test.db' }), /PostgreSQL/)
})
