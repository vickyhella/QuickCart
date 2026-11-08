import RepositoryPage from '@/components/RepositoryPage'
import { getPublicRepositoryPageMetadata } from '@/lib/repository-page-content'

export async function generateMetadata() {
  return getPublicRepositoryPageMetadata('how-to-apply')
}

export default function Page() {
  return <RepositoryPage slug="how-to-apply" />
}
