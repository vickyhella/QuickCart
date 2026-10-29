export const adminHomeLink = { label: 'Admin home', href: '/admin' } as const

export function isMediaNavigationActive(pathname: string) {
  return pathname === '/admin/collections/media' ||
    pathname.startsWith('/admin/collections/media/') ||
    pathname === '/admin/collections/media-originals' ||
    pathname.startsWith('/admin/collections/media-originals/')
}

export const mediaWorkspaceTabs = [
  { label: 'Media', href: '/admin/collections/media', matches: (path: string) => path === '/admin/collections/media' },
  { label: 'Media Originals', href: '/admin/collections/media-originals', matches: (path: string) => path === '/admin/collections/media-originals' },
  { label: 'Image compression', href: '/admin/collections/media/compression', matches: (path: string) => path === '/admin/collections/media/compression' },
  { label: 'Image names & metadata', href: '/admin/collections/media/metadata', matches: (path: string) => path === '/admin/collections/media/metadata' },
] as const

export const productWorkspaceTabs = [
  { label: 'Product Studio', href: '/admin/collections/products/studio' },
  { label: 'Products', href: '/admin/collections/products' },
  { label: 'Categories', href: '/admin/collections/products/categories' },
  { label: 'Spreadsheet', href: '/admin/collections/products/spreadsheet' },
] as const

export const studioLinks = [
  { label: 'Product Studio', href: '/admin/collections/products/studio', description: 'Create, manage, publish, and bulk edit products.' },
  { label: 'Marketing Studio', href: '/admin/collections/marketing/studio', description: 'Manage Pinterest, SEO, and product feeds.' },
] as const

export const adminDashboardSections = [
  { title: 'Studio', links: studioLinks },
  {
    title: 'Store',
    links: [
      { label: 'Users', href: '/admin/collections/users', description: 'Manage administrator accounts and access.' },
      { label: 'Customers', href: '/admin/collections/customers', description: 'Manage storefront customer accounts and migration references.' },
      { label: 'Contact forms', href: '/admin/collections/contact-messages', description: 'Review messages submitted through the storefront contact form.' },
    ],
  },
  {
    title: 'Media',
    links: [
      { label: 'Media', href: '/admin/collections/media', description: 'Manage images, originals, compression, filenames, and metadata.' },
    ],
  },
  {
    title: 'Website',
    links: [
      { label: 'Pages', href: '/admin/collections/pages', description: 'Edit storefront pages; view repository-managed policy links and Markdown locations.' },
    ],
  },
  {
    title: 'Commerce',
    links: [
      { label: 'Orders', href: '/admin/collections/orders', description: 'Review customer payments and fulfillment.' },
      { label: 'Discounts', href: '/admin/collections/discounts', description: 'Create and manage checkout discount codes.' },
      { label: 'Store settings', href: '/admin/globals/store-settings', description: 'Preview repository-managed shipping rates, countries and delivery times; view the configuration file location.' },
    ],
  },
] as const
