export const config = { schedule: '0 9 * * *' }

export default async function publishScheduledPins(): Promise<void> {
  const { CRON_SECRET, PINTEREST_ACCESS_TOKEN, PINTEREST_BOARD_ID, URL: siteURL } = process.env
  if (!CRON_SECRET || !PINTEREST_ACCESS_TOKEN || !PINTEREST_BOARD_ID) {
    console.info('Pinterest publishing skipped because its production settings are incomplete.')
    return
  }

  if (!siteURL) throw new Error('Netlify did not provide the production site URL.')
  const endpoint = new URL('/api/cron/pinterest-publish/', siteURL)
  if (endpoint.protocol !== 'https:') {
    throw new Error('Pinterest publishing requires an HTTPS site URL.')
  }

  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
    redirect: 'error',
    signal: AbortSignal.timeout(25_000),
  })
  if (!response.ok) {
    throw new Error(`Pinterest publishing endpoint returned HTTP ${response.status}.`)
  }

  const { processed, remaining, results } = await response.json() as {
    processed: number
    remaining: number
    results: { status: string }[]
  }
  const failed = results.filter(({ status }) => status === 'failed').length
  console.info(`Pinterest publishing processed ${processed} post(s), with ${failed} failure(s) and ${remaining} due post(s) still queued.`)
  if (failed) throw new Error('Check the failed records in Pinterest Posts for details.')
}
