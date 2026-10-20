import type { CollectionConfig } from 'payload'
import { isAdminUser } from '../lib/admin-access'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  access: {
    admin: ({ req }) => isAdminUser(req.user),
    create: ({ req }) => isAdminUser(req.user),
    read: ({ req }) => isAdminUser(req.user),
    update: ({ req }) => isAdminUser(req.user),
    delete: ({ req }) => isAdminUser(req.user),
  },
  admin: {
    group: 'Store',
    useAsTitle: 'email',
  },
  fields: [],
}
