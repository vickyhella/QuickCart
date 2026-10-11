import type { CollectionConfig } from 'payload'

export const Discounts: CollectionConfig = {
  slug: 'discounts',
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  admin: {
    group: 'Commerce',
    useAsTitle: 'code',
    defaultColumns: ['code', 'kind', 'value', 'active', 'expiresAt'],
    description: 'Create discount codes for checkout.',
  },
  hooks: {
    beforeChange: [({ data }) => ({ ...data, code: data.code?.trim().toUpperCase() })],
  },
  fields: [
    { name: 'code', type: 'text', required: true, unique: true, index: true },
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: [
        { label: 'Percentage', value: 'percentage' },
        { label: 'Fixed amount', value: 'fixed' },
      ],
    },
    { name: 'value', type: 'number', required: true, min: 0 },
    { name: 'minimumSubtotal', type: 'number', min: 0 },
    { name: 'usageLimit', type: 'number', min: 1 },
    { name: 'usageCount', type: 'number', min: 0, defaultValue: 0, admin: { readOnly: true } },
    { name: 'expiresAt', type: 'date' },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}
