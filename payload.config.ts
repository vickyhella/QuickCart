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
import { MarketingWorkspace } from './collections/MarketingWorkspace'
import { ContactMessages } from './collections/ContactMessages'
import { Discounts } from './collections/Discounts'
import { Orders } from './collections/Orders'
import { Pages } from './collections/Pages'
import { Products } from './collections/Products'
import { PinterestPosts } from './collections/PinterestPosts'
import { Users } from './collections/Users'
import { StoreSettings } from './globals/StoreSettings'
import { MarketingSettings } from './globals/MarketingSettings'
import { ProductDimensions } from './globals/ProductDimensions'
import { assertRuntimeEnvironmentConfigured, getEnvironmentVariable, getRuntimeEnvironment } from './lib/environment-config'

const filename = fileURLToPath(import.meta.url)
const runtimeEnvironment = getRuntimeEnvironment()
assertRuntimeEnvironmentConfigured()
const databaseURL = getEnvironmentVariable('DATABASE_URL')
const databaseAdapter = databaseURL
  ? postgresAdapter({
      pool: {
        connectionString: databaseURL,
      },
    })
  : sqliteAdapter({
      client: {
        url: `file:${path.resolve(process.cwd(), `payload-${runtimeEnvironment}.sqlite`)}`,
      },
    })

const r2Bucket = getEnvironmentVariable('R2_BUCKET')
const r2Endpoint = getEnvironmentVariable('R2_ENDPOINT')
const r2AccessKeyID = getEnvironmentVariable('R2_ACCESS_KEY_ID')
const r2SecretAccessKey = getEnvironmentVariable('R2_SECRET_ACCESS_KEY')
const r2PublicURL = getEnvironmentVariable('R2_PUBLIC_URL')?.replace(/\/$/, '')
const r2Enabled = Boolean(
  r2Bucket && r2AccessKeyID && r2SecretAccessKey && r2Endpoint && r2PublicURL,
)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(path.dirname(filename), 'app/(payload)'),
    },
    components: {
      actions: ['/components/StorefrontHomeAction#StorefrontHomeAction'],
      beforeNavLinks: ['/components/StudioNavLink#StudioNavLink'],
      views: {
        dashboard: { Component: '/components/AdminDashboard#AdminDashboard' },
      },
    },
  },
  collections: [Users, ContactMessages, Products, Media, MediaOriginals, MarketingWorkspace, Pages, Orders, Discounts, PinterestPosts],
  globals: [StoreSettings, MarketingSettings, ProductDimensions],
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
      bucket: r2Bucket || '',
      config: {
        credentials: {
          accessKeyId: r2AccessKeyID || '',
          secretAccessKey: r2SecretAccessKey || '',
        },
        region: 'auto',
        endpoint: r2Endpoint,
        forcePathStyle: true,
      },
      // Uploads must pass through Payload so the media hook can preserve
      // originals and create optimized WebP derivatives before storage.
      clientUploads: false,
    }),
  ],
  editor: lexicalEditor(),
  secret: getEnvironmentVariable('PAYLOAD_SECRET') || '',
  db: databaseAdapter,
  sharp,
  typescript: {
    outputFile: path.resolve(path.dirname(filename), 'payload-types.ts'),
  },
})
