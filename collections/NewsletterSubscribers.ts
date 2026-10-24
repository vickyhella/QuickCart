import type { CollectionConfig } from 'payload'
import { isAdminUser } from '../lib/admin-access'

export const NewsletterSubscribers: CollectionConfig = {
  slug: 'newsletter-subscribers',
  labels: { singular: 'Newsletter subscriber', plural: 'Newsletter subscribers' },
  admin: {
    group: 'Store',
    useAsTitle: 'email',
    defaultColumns: ['email', 'status', 'source', 'consentAt', 'createdAt'],
    description: 'Email addresses that opted in to Ginny Nana updates.',
  },
  access: {
    read: ({ req }) => isAdminUser(req.user),
    create: ({ req }) => isAdminUser(req.user),
    update: ({ req }) => isAdminUser(req.user),
    delete: ({ req }) => isAdminUser(req.user),
  },
  fields: [
    { name: 'email', type: 'email', required: true, unique: true },
    {
      name: 'status', type: 'select', required: true, defaultValue: 'active',
      options: [{ label: 'Active', value: 'active' }, { label: 'Unsubscribed', value: 'unsubscribed' }],
    },
    { name: 'consentAt', type: 'date', required: true },
    { name: 'source', type: 'text', defaultValue: 'homepage' },
  ],
}
