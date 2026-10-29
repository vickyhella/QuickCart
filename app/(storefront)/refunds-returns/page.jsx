import RepositoryPage from '@/components/RepositoryPage'
import { getPublicRepositoryPageMetadata } from '@/lib/repository-page-content'

export async function generateMetadata() {
  return getPublicRepositoryPageMetadata('refunds-returns')
}

export default function Page() {
  return <RepositoryPage slug="refunds-returns" />
}
