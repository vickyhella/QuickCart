import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import ProductStudio from './product-studio'

export const dynamic = 'force-dynamic'

export default async function StudioPage() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })

  if (!user) redirect('/admin/login/?redirect=%2Fstudio')

  return <ProductStudio userEmail={user.email} />
}
