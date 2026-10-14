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
