import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { Media } from './collections/Media'
import { MediaOriginals } from './collections/MediaOriginals'
import { ContactMessages } from './collections/ContactMessages'
import { Discounts } from './collections/Discounts'
import { Orders } from './collections/Orders'
import { Pages } from './collections/Pages'
import { Products } from './collections/Products'
import { PinterestPosts } from './collections/PinterestPosts'
import { Users } from './collections/Users'
import { StoreSettings } from './globals/StoreSettings'
import { MarketingSettings } from './globals/MarketingSettings'

const filename = fileURLToPath(import.meta.url)
const databaseAdapter = process.env.DATABASE_URL
  ? postgresAdapter({
      pool: {
        connectionString: process.env.DATABASE_URL,
      },
    })
  : sqliteAdapter({
      client: {
        url: `file:${path.resolve(process.cwd(), 'payload.sqlite')}`,
      },
    })

const r2PublicURL = process.env.R2_PUBLIC_URL?.replace(/\/$/, '')
const r2Enabled = Boolean(
  process.env.R2_BUCKET &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_ENDPOINT &&
    r2PublicURL,
)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(path.dirname(filename), 'app/(payload)'),
    },
    components: {
      actions: ['/components/StorefrontHomeAction#StorefrontHomeAction'],
      afterNavLinks: ['/components/StudioNavLink#StudioNavLink', '/components/MarketingNavLink#MarketingNavLink'],
      views: {
        dashboard: { Component: '/components/AdminDashboard#AdminDashboard' },
      },
    },
  },
  collections: [Users, Media, MediaOriginals, Products, Pages, ContactMessages, Orders, Discounts, PinterestPosts],
  globals: [StoreSettings, MarketingSettings],
  plugins: [
    s3Storage({
      enabled: r2Enabled,
      collections: {
        media: {
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) =>
            `${r2PublicURL}/${prefix ? `${prefix}/` : ''}${filename}`,
        },
        'media-originals': {
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) =>
            `${r2PublicURL}/${prefix ? `${prefix}/` : ''}${filename}`,
        },
      },
      bucket: process.env.R2_BUCKET || '',
      config: {
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT,
        forcePathStyle: true,
      },
      // Uploads must pass through Payload so the media hook can preserve
      // originals and create optimized WebP derivatives before storage.
      clientUploads: false,
    }),
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  db: databaseAdapter,
  sharp,
  typescript: {
    outputFile: path.resolve(path.dirname(filename), 'payload-types.ts'),
  },
})
