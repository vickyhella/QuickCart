import type { CollectionConfig } from 'payload'

/** Untouched source uploads retained for future WebP reprocessing. */
export const MediaOriginals: CollectionConfig = {
  slug: 'media-originals',
  admin: {
    group: 'Catalog',
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'mimeType', 'filesize', 'createdAt'],
    description: 'Original image files retained as sources for WebP conversion and future reprocessing.',
  },
  upload: {
    staticDir: 'public/media-originals',
    mimeTypes: ['image/*'],
  },
  fields: [
    { name: 'title', type: 'text', admin: { readOnly: true } },
  ],
}
