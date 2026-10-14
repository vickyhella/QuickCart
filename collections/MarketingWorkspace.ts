import type { CollectionConfig } from 'payload'

export const MarketingWorkspace: CollectionConfig = {
  slug: 'marketing',
  labels: { singular: 'Marketing workspace', plural: 'Marketing workspace' },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  admin: {
    group: false,
    components: {
      views: {
        studio: {
          Component: '/components/MarketingStudioView#MarketingStudioView',
          path: '/studio',
          exact: true,
        },
      },
    },
  },
  fields: [],
}
