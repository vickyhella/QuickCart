import { isAdminUser } from '../lib/admin-access'
import type { CollectionConfig } from 'payload'

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  hooks: {
    beforeValidate: [
      async ({ data, originalDoc, req }) => {
        if (!data) return data
        const title = String(data.title || originalDoc?.title || '').trim()
        const requestedSlug = typeof data.slug === 'string' ? data.slug.trim() : ''
        const oldGeneratedSlug = originalDoc ? slugify(String(originalDoc.title || '')) : ''

        const hasRequestedSlug = typeof data.slug === 'string'
        const slugWasGenerated = !originalDoc || (hasRequestedSlug ? (!requestedSlug || requestedSlug === oldGeneratedSlug) : originalDoc.slug === oldGeneratedSlug)
        if (title && slugWasGenerated) {
          const baseSlug = slugify(title) || 'page'
          let candidate = baseSlug
          let suffix = 2
          while (true) {
            const collision = await req.payload.find({
              collection: 'pages',
              where: { slug: { equals: candidate } },
              limit: 1,
              depth: 0,
              overrideAccess: true,
            })
            const owner = collision.docs[0]
            if (!owner || String(owner.id) === String(originalDoc?.id ?? '')) break
            candidate = `${baseSlug}-${suffix++}`
          }
          data.slug = candidate
        }
        return data
      },
    ],
  },
  access: {
    read: ({ req }) =>
      isAdminUser(req.user) ? true : { status: { equals: 'published' } },
    create: ({ req }) => isAdminUser(req.user),
    update: ({ req }) => isAdminUser(req.user),
    delete: ({ req }) => isAdminUser(req.user),
  },
  admin: {
    group: 'Website',
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
    {
      name: 'placement', type: 'select', defaultValue: 'hidden',
      required: true,
      options: [
        { label: 'How to Use navigation', value: 'navigation' },
        { label: 'Footer — Explore', value: 'footer-explore' },
        { label: 'Footer — Customer care', value: 'footer-customer-care' },
        { label: 'Hidden', value: 'hidden' },
      ],
      admin: { position: 'sidebar', description: 'Choose where this published page appears in the storefront. Set Status to Published for it to appear.' },
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
