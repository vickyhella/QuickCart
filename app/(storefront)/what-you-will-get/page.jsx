import RepositoryPage from '@/components/RepositoryPage'
import { getPublicRepositoryPageMetadata } from '@/lib/repository-page-content'

export async function generateMetadata() {
  return getPublicRepositoryPageMetadata('what-you-will-get')
}

export default function Page() {
  return <RepositoryPage slug="what-you-will-get" />
}
