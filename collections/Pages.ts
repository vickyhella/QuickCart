import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: {
    read: ({ req }) =>
      req.user ? true : { status: { equals: 'published' } },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    description: 'Edit static pages and store policies. The body supports Markdown.',
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'The part of the URL after the domain. Keep legacy slugs unchanged.',
      },
    },
    {
      name: 'body',
      type: 'textarea',
      admin: {
        rows: 24,
        description: 'Markdown supported: headings, lists, links, bold, italic, quotes, and tables.',
      },
    },
    { name: 'seoTitle', type: 'text', admin: { position: 'sidebar' } },
    { name: 'seoDescription', type: 'textarea', admin: { position: 'sidebar' } },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
