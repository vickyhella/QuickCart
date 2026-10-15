type Environment = 'development' | 'preview' | 'production'
type EnvironmentVariables = Record<string, string | undefined>

export function getRuntimeEnvironment(env: EnvironmentVariables = process.env): Environment {
  if (env.NODE_ENV === 'development') return 'development'
  const configured = env.VERCEL_ENV || env.QUICKCART_ENVIRONMENT
  if (configured === 'development' || configured === 'preview' || configured === 'production') return configured
  if (env.CONTEXT === 'production') return 'production'
  if (env.CONTEXT && env.CONTEXT !== 'dev') return 'preview'
  return 'development'
}

export function getEnvironmentVariable(name: string, env: EnvironmentVariables = process.env): string | undefined {
  const environment = getRuntimeEnvironment(env)
  const suffix = environment === 'production' ? '' : `_${environment.toUpperCase()}`
  return env[`${name}${suffix}`]
}

export function assertRuntimeEnvironmentConfigured(env: EnvironmentVariables = process.env): void {
  const environment = getRuntimeEnvironment(env)
  if (environment === 'development') return

  const required = [
    'DATABASE_URL',
    'PAYLOAD_SECRET',
    'R2_BUCKET',
    'R2_ENDPOINT',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_PUBLIC_URL',
  ]
  const suffix = environment === 'production' ? '' : '_PREVIEW'
  const missing = required.filter((name) => !getEnvironmentVariable(name, env))

  if (missing.length) {
    throw new Error(`Missing required ${environment} environment variables: ${missing.map((name) => `${name}${suffix}`).join(', ')}`)
  }
}
