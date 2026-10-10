import nextEnv from '@next/env'
import { getPayload } from 'payload'

nextEnv.loadEnvConfig(process.cwd())
const environment = process.env as Record<string, string | undefined>
environment.NODE_ENV ??= 'development'

const { default: config } = await import('../payload.config')
const payload = await getPayload({ config })

const samples = [
  {
    title: 'TEST · Petal Dusk',
    slug: 'test-petal-dusk',
    sku: 'TEST-NAIL-001',
    description: 'Test listing: a soft blush press-on set with delicate petal accents. Replace this sample copy and add product photos in the admin when you are ready.',
    price: 19.9,
    compareAtPrice: 22.9,
    category: 'press-on-nails',
    length: 'medium',
    shape: 'almond',
    status: 'published',
    isNew: true,
    isBestSeller: false,
  },
  {
    title: 'TEST · Rosy Cat Eye',
    slug: 'test-rosy-cat-eye',
    sku: 'TEST-NAIL-002',
    description: 'Test listing: a rosy, light-catching manicure in a short oval shape. Replace this sample copy and add product photos in the admin when you are ready.',
    price: 18.9,
    category: 'press-on-nails',
    length: 'short',
    shape: 'oval',
    status: 'published',
    isNew: true,
    isBestSeller: false,
  },
]

try {
  for (const sample of samples) {
    const existing = await payload.find({
      collection: 'products',
      where: { sku: { equals: sample.sku } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.docs.length) {
      payload.logger.info(`Already exists: ${sample.sku}`)
      continue
    }

    await payload.create({
      collection: 'products',
      data: sample,
      overrideAccess: true,
    })
    payload.logger.info(`Created: ${sample.title}`)
  }
} finally {
  await payload.destroy()
}
