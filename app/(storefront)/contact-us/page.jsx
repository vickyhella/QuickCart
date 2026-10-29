import RepositoryPage from '@/components/RepositoryPage'
import { getPublicRepositoryPageMetadata } from '@/lib/repository-page-content'

export async function generateMetadata() {
  return getPublicRepositoryPageMetadata('contact-us')
}

export default function Page() {
  return <RepositoryPage slug="contact-us" />
}
