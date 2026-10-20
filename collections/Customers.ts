import type { CollectionConfig } from 'payload'
import { isAdminUser } from '../lib/admin-access'
import { upgradeLegacyCustomerPassword } from '../lib/legacy-customer-password'

export const Customers: CollectionConfig = {
  slug: 'customers',
  // Payload's bootstrap registration bypasses create access; customers are imported by administrators.
  endpoints: [{ path: '/first-register', method: 'post', handler: () => Response.json({ error: 'Customer registration is not available.' }, { status: 403 }) }],
  auth: {
    tokenExpiration: 7200,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    useSessions: true,
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
  },
  admin: {
    group: 'Store',
    useAsTitle: 'email',
    defaultColumns: ['email', 'fullName', 'legacyWordpressID', 'createdAt'],
    description: 'Storefront customers. Administrator accounts are managed separately in Users.',
  },
  access: {
    admin: () => false,
    create: ({ req }) => isAdminUser(req.user),
    read: ({ req }) => isAdminUser(req.user) ? true : req.user?.collection === 'customers' ? { id: { equals: req.user.id } } : false,
    update: ({ req }) => isAdminUser(req.user),
    delete: ({ req }) => isAdminUser(req.user),
  },
  hooks: {
    beforeOperation: [upgradeLegacyCustomerPassword],
    beforeChange: [({ data, originalDoc, operation, req }) => {
      if (operation === 'update' && data.password) {
        if (req.context.verifiedLegacyHash && originalDoc?.legacyPasswordHash !== req.context.verifiedLegacyHash) {
          throw new Error('Account credentials changed. Please sign in again.')
        }
        data.legacyPasswordHash = null
      }
      return data
    }],
  },
  fields: [
    { name: 'fullName', type: 'text' },
    { name: 'legacyWordpressID', type: 'text', label: 'Legacy WordPress ID', unique: true, index: true, admin: { readOnly: true } },
    {
      name: 'billingAddress',
      type: 'group',
      fields: [
        { name: 'company', type: 'text' },
        { name: 'address1', type: 'text' },
        { name: 'address2', type: 'text' },
        { name: 'city', type: 'text' },
        { name: 'state', type: 'text' },
        { name: 'postalCode', type: 'text' },
        { name: 'country', type: 'text' },
        { name: 'phone', type: 'text' },
      ],
    },
    {
      name: 'shippingAddress',
      type: 'group',
      fields: [
        { name: 'company', type: 'text' },
        { name: 'address1', type: 'text' },
        { name: 'address2', type: 'text' },
        { name: 'city', type: 'text' },
        { name: 'state', type: 'text' },
        { name: 'postalCode', type: 'text' },
        { name: 'country', type: 'text' },
        { name: 'phone', type: 'text' },
      ],
    },
    {
      name: 'legacyPasswordHash', type: 'text', hidden: true,
      access: { read: () => false, create: () => false, update: () => false },
    },
  ],
}
