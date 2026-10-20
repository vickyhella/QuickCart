import { readFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { parseEnv } from 'node:util'
import { fileURLToPath } from 'node:url'
import { assertRuntimeEnvironmentConfigured } from '../lib/environment-config'

export function migrationEnvironment(target: string, values: Record<string, string>, inherited: Record<string, string | undefined> = process.env) {
  if (target !== 'preview' && target !== 'production') {
    throw new Error('Choose preview or production explicitly.')
  }
  // Validate the selected file alone: inherited secrets must never fill missing settings.
  const selected = {
    ...values,
    NODE_ENV: 'production' as const,
    VERCEL_ENV: target,
    QUICKCART_ENVIRONMENT: target,
  }
  assertRuntimeEnvironmentConfigured(selected)
  const url = new URL(values[target === 'preview' ? 'DATABASE_URL_PREVIEW' : 'DATABASE_URL'])
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('A PostgreSQL database URL is required.')
  return { ...inherited, ...selected }
}

function main() {
  const [target, action = 'status', ...extra] = process.argv.slice(2)
  if (!['preview', 'production'].includes(target) || !['status', 'apply'].includes(action) || extra.length) {
    throw new Error('Usage: npm run migrate:preview|migrate:production -- [status|apply]')
  }
  const envFile = target === 'preview' ? '.env.netlify-dev' : '.env.netlify-production'
  let values: Record<string, string>
  try {
    values = parseEnv(readFileSync(envFile, 'utf8'))
  } catch {
    throw new Error(`Cannot read ${envFile}. Configure this dedicated environment file first; .env.local is never used as a fallback.`)
  }
  const env = migrationEnvironment(target, values)
  const database = new URL(values[target === 'preview' ? 'DATABASE_URL_PREVIEW' : 'DATABASE_URL'])
  console.log(`Migration ${action}: ${target}; file=${envFile}; database host=${database.hostname}`)
  const result = spawnSync(process.execPath, [
    path.resolve('node_modules/payload/bin.js'),
    action === 'status' ? 'migrate:status' : 'migrate',
  ], { env, stdio: 'inherit' })
  if (result.error) throw result.error
  process.exitCode = result.status ?? 1
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main() } catch (error) {
    console.error(error instanceof Error ? error.message : 'Migration failed.')
    process.exitCode = 1
  }
}
