import { getHomepageSettings } from '@/lib/homepage-settings'

export async function GET() {
  return Response.json(await getHomepageSettings(), { headers: { 'Cache-Control': 'no-store' } })
}
