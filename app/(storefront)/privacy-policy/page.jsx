import RepositoryPage from '@/components/RepositoryPage'
import { getPublicRepositoryPageMetadata } from '@/lib/repository-page-content'

export async function generateMetadata() {
  return getPublicRepositoryPageMetadata('privacy-policy')
}

export default function Page() {
  return <RepositoryPage slug="privacy-policy" />
}
