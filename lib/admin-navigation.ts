export const studioLinks = [
  { label: 'Product Studio', href: '/studio', description: 'Create, edit, and publish products.' },
  { label: 'Spreadsheet Editor', href: '/studio/spreadsheet', description: 'Review and update product and variant data in bulk.' },
  { label: 'Marketing Studio', href: '/marketing-studio', description: 'Prepare and schedule Pinterest posts.' },
] as const

export const storeFeedLinks = [
  { label: 'Feeds', tab: 'feeds', href: '/admin/collections/products/marketing?tab=feeds', description: 'Preview Google Merchant Center and Pinterest product feeds.' },
  { label: 'SEO & Media', tab: 'seo', href: '/admin/collections/products/marketing?tab=seo', description: 'Manage product templates, image metadata, and compression.' },
  { label: 'Countries', tab: 'countries', href: '/admin/collections/products/marketing?tab=countries', description: 'Set countries available for checkout and feed targeting.' },
] as const

export const adminDashboardSections = [
  { title: 'Studios', links: studioLinks },
  {
    title: 'Store',
    links: [
      { label: 'Users', href: '/admin/collections/users', description: 'Manage administrator accounts and access.' },
      { label: 'Contact messages', href: '/admin/collections/contact-messages', description: 'Review customer questions submitted through the store.' },
    ],
  },
  {
    title: 'Catalog',
    links: [
      { label: 'Media', href: '/admin/collections/media', description: 'Manage product images and their search metadata.' },
      { label: 'Media originals', href: '/admin/collections/media-originals', description: 'View source images preserved for future reprocessing.' },
      { label: 'Products', href: '/admin/collections/products', description: 'Maintain products, variants, prices, and publishing status.' },
    ],
  },
  {
    title: 'Website',
    links: [
      { label: 'Pages', href: '/admin/collections/pages', description: 'Edit storefront pages and policies.' },
    ],
  },
  {
    title: 'Commerce',
    links: [
      { label: 'Orders', href: '/admin/collections/orders', description: 'Review customer payments and fulfillment.' },
      { label: 'Discounts', href: '/admin/collections/discounts', description: 'Create and manage checkout discount codes.' },
      { label: 'Store settings', href: '/admin/globals/store-settings', description: 'Configure currency, shipping, and tax behavior.' },
    ],
  },
  {
    title: 'Pinterest',
    links: [
      { label: 'Publishing posts', href: '/admin/collections/pinterest-posts', description: 'Schedule and review product Pins.' },
    ],
  },
  { title: 'Store & Feeds', links: storeFeedLinks },
] as const
