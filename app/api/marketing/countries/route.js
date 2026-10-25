import { NextResponse } from 'next/server'
import { getStorefrontMarketingSettings } from '@/lib/storefront-catalog'
import { shippingCountries } from '@/lib/countries'

export const dynamic = 'force-dynamic'

export async function GET() {
  const settings = await getStorefrontMarketingSettings()
  const configured = Array.isArray(settings?.availableCountries) ? settings.availableCountries : []
  const codes = configured.length ? configured : shippingCountries.map(([code]) => code)
  return NextResponse.json({ countries: shippingCountries.filter(([code]) => codes.includes(code)) }, { headers: { 'Cache-Control': 'no-store' } })
}
