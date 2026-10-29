import { NextResponse } from 'next/server'
import contentSources from '@/config/content-sources.json'
import { checkoutCountries, getShippingSettings } from '@/lib/shipping-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (contentSources.shipping === 'repository') return NextResponse.json({ countries: checkoutCountries }, { headers: { 'Cache-Control': 'no-store' } })
  const [{ getPayload }, { default: config }, { shippingCountries }] = await Promise.all([import('payload'), import('@/payload.config'), import('@/lib/countries')])
  const payload = await getPayload({ config })
  const settings = await getShippingSettings(payload)
  const countries = shippingCountries.filter(([code]) => settings.availableCountries.includes(code))
  return NextResponse.json({ countries }, { headers: { 'Cache-Control': 'no-store' } })
}
