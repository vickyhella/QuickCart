import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import MarketingStudio from './marketing-studio'

export const dynamic = 'force-dynamic'

export default async function MarketingStudioPage() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login/?redirect=%2Fmarketing-studio')

  return <MarketingStudio />
}
