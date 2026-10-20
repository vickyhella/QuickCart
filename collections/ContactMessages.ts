import { isAdminUser } from '../lib/admin-access'
import type { CollectionConfig } from 'payload'

export const ContactMessages: CollectionConfig = {
  slug: 'contact-messages',
  labels: { singular: 'Contact form', plural: 'Contact forms' },
  admin: {
    group: 'Store',
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'subject', 'status', 'createdAt'],
    description: 'Messages submitted through the public Contact Us form.',
  },
  access: {
    read: ({ req }) => isAdminUser(req.user),
    create: ({ req }) => isAdminUser(req.user),
    update: ({ req }) => isAdminUser(req.user),
    delete: ({ req }) => isAdminUser(req.user),
  },
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 100 },
    { name: 'email', type: 'email', required: true },
    { name: 'subject', type: 'text', required: true, maxLength: 150 },
    { name: 'message', type: 'textarea', required: true, maxLength: 8000 },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'In progress', value: 'in-progress' },
        { label: 'Replied', value: 'replied' },
      ],
    },
  ],
}
