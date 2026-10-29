import contentSources from '../config/content-sources.json'

// Shared by server pages, the footer and Admin.
export const repositoryPages = [
  { slug: 'about-us', title: 'About Us', placement: 'footer-explore', description: 'Meet Ginny Nana and our handmade press-on nails.' },
  { slug: 'contact-us', title: 'Contact Us', placement: 'footer-explore', description: 'Contact Ginny Nana for help with products, orders and shipping.' },
  { slug: 'privacy-policy', title: 'Privacy Policy', placement: 'footer-customer-care', description: 'How Ginny Nana collects and uses your personal information.' },
  { slug: 'terms-conditions', title: 'Terms of Service', placement: 'footer-customer-care', description: 'Terms for shopping with Ginny Nana.' },
  { slug: 'refunds-returns', title: 'Refunds & Returns', placement: 'footer-customer-care', description: 'Ginny Nana cancellation, quality issue, return and refund policies.' },
  { slug: 'shipping-policy', title: 'Shipping Policy', placement: 'footer-customer-care', description: 'Ginny Nana shipping destinations, rates and delivery estimates.' },
] as const

export const repositoryPageSlugs = repositoryPages.map(({ slug }) => slug)
export const isRepositoryPage = (slug: unknown) => contentSources.policies === 'repository' && repositoryPageSlugs.includes(slug as typeof repositoryPageSlugs[number])

export function repositoryPageMetadata(slug: string) {
  const page = repositoryPages.find((page) => page.slug === slug)
  if (!page) throw new Error(`Unknown repository page: ${slug}`)
  return { title: `${page.title} | Ginny Nana`, description: page.description }
}

export function mergeRepositoryPages(pages: { slug: string; title: string; placement?: string }[] = []) {
  return contentSources.policies === 'repository'
    ? [...repositoryPages, ...pages.filter(({ slug }) => !repositoryPageSlugs.includes(slug as typeof repositoryPageSlugs[number]))]
    : pages
}
