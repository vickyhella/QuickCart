import type { CollectionConfig } from 'payload'
import { isAdminUser } from '../lib/admin-access'

/** Untouched source uploads retained for future WebP reprocessing. */
export const MediaOriginals: CollectionConfig = {
  slug: 'media-originals',
  access: {
    create: ({ req }) => isAdminUser(req.user),
    read: ({ req }) => isAdminUser(req.user),
    update: ({ req }) => isAdminUser(req.user),
    delete: () => false,
  },
  admin: {
    group: false,
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'mimeType', 'filesize', 'createdAt'],
    description: 'Original image files retained as sources for WebP conversion and future reprocessing.',
    components: { beforeList: ['/components/MediaWorkspaceTabs#MediaWorkspaceTabs', '/components/OriginalsCleanup#OriginalsCleanup'] },
  },
  upload: {
    staticDir: 'public/media-originals',
    mimeTypes: ['image/*'],
  },
  fields: [
    { name: 'title', type: 'text', admin: { readOnly: true } },
  ],
}
