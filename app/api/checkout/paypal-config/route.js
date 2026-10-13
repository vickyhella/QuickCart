import { NextResponse } from 'next/server'
import { getPayPalPublicConfig } from '@/lib/paypal'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(getPayPalPublicConfig(), {
    headers: { 'Cache-Control': 'no-store' },
  })
}
