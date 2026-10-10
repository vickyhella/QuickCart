import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { Media } from './collections/Media'
import { Discounts } from './collections/Discounts'
import { Orders } from './collections/Orders'
import { Pages } from './collections/Pages'
import { Products } from './collections/Products'
import { Users } from './collections/Users'
import { StoreSettings } from './globals/StoreSettings'

const filename = fileURLToPath(import.meta.url)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(path.dirname(filename), 'app/(payload)'),
    },
  },
  collections: [Users, Media, Products, Pages, Orders, Discounts],
  globals: [StoreSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  db: sqliteAdapter({
    client: {
      url: `file:${path.resolve(process.cwd(), 'payload.sqlite')}`,
    },
  }),
  sharp,
  typescript: {
    outputFile: path.resolve(path.dirname(filename), 'payload-types.ts'),
  },
})
