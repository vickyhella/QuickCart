import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { shippingCountries } from '@/lib/countries'

export const dynamic = 'force-dynamic'

export async function GET() {
  const payload = await getPayload({ config })
  const settings = await payload.findGlobal({ slug: 'marketing-settings', overrideAccess: true }).catch(() => null)
  const configured = Array.isArray(settings?.availableCountries) ? settings.availableCountries : []
  const codes = configured.length ? configured : shippingCountries.map(([code]) => code)
  return NextResponse.json({ countries: shippingCountries.filter(([code]) => codes.includes(code)) }, { headers: { 'Cache-Control': 'no-store' } })
}
