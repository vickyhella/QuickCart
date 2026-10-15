import assert from 'node:assert/strict'
import test from 'node:test'
import { assertRuntimeEnvironmentConfigured, getEnvironmentVariable, getRuntimeEnvironment } from '../lib/environment-config'

test('local development never falls back to production database or R2 settings', () => {
  const env = {
    NODE_ENV: 'development',
    VERCEL_ENV: 'production',
    DATABASE_URL: 'production-db',
    R2_BUCKET: 'production-bucket',
  }

  assert.equal(getRuntimeEnvironment(env), 'development')
  assert.equal(getEnvironmentVariable('DATABASE_URL', env), undefined)
  assert.equal(getEnvironmentVariable('R2_BUCKET', env), undefined)
})

test('each deployment environment reads only its own suffixed settings', () => {
  const env = {
    NODE_ENV: 'production',
    VERCEL_ENV: 'preview',
    DATABASE_URL: 'production-db',
    DATABASE_URL_PREVIEW: 'preview-db',
  }

  assert.equal(getRuntimeEnvironment(env), 'preview')
  assert.equal(getEnvironmentVariable('DATABASE_URL', env), 'preview-db')
})

test('production reads the standard production setting names', () => {
  const env = { NODE_ENV: 'production', VERCEL_ENV: 'production', R2_BUCKET: 'production-bucket' }

  assert.equal(getEnvironmentVariable('R2_BUCKET', env), 'production-bucket')
})

test('preview requires isolated database and R2 configuration instead of silently using local storage', () => {
  const env = {
    NODE_ENV: 'production',
    VERCEL_ENV: 'preview',
    DATABASE_URL: 'production-db',
    PAYLOAD_SECRET: 'production-secret',
    R2_BUCKET: 'production-bucket',
    R2_ENDPOINT: 'production-endpoint',
    R2_ACCESS_KEY_ID: 'production-key',
    R2_SECRET_ACCESS_KEY: 'production-secret-key',
    R2_PUBLIC_URL: 'https://production.example',
  }

  assert.throws(() => assertRuntimeEnvironmentConfigured(env), /DATABASE_URL_PREVIEW.*R2_BUCKET_PREVIEW/)
})

test('fully configured production passes the environment guard', () => {
  assert.doesNotThrow(() => assertRuntimeEnvironmentConfigured({
    NODE_ENV: 'production',
    VERCEL_ENV: 'production',
    DATABASE_URL: 'production-db',
    PAYLOAD_SECRET: 'production-secret',
    R2_BUCKET: 'production-bucket',
    R2_ENDPOINT: 'production-endpoint',
    R2_ACCESS_KEY_ID: 'production-key',
    R2_SECRET_ACCESS_KEY: 'production-secret-key',
    R2_PUBLIC_URL: 'https://production.example',
  }))
})
