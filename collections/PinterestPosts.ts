import type { CollectionConfig } from 'payload'
import { pinterestProductLink } from '../lib/pinterest-product-link'

export const PinterestPosts: CollectionConfig = {
  slug: 'pinterest-posts',
  labels: { singular: 'Publishing post', plural: 'Publishing posts' },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  admin: {
    group: false,
    components: {
      beforeList: ['/components/PinterestPublishing#PinterestPublishing'],
    },
    useAsTitle: 'title',
    defaultColumns: ['title', 'product', 'status', 'scheduledAt', 'publishedAt'],
    description: 'Schedule product and variant Pins. Publishing requires Pinterest API credentials and a public image URL.',
  },
  hooks: {
    beforeValidate: [async ({ data, req }) => {
      if (!data) return data
      const productID = typeof data.product === 'object' && data.product ? data.product.id : data.product
      if (!productID) return data
      const product: any = await req.payload.findByID({ collection: 'products', id: String(productID), depth: 1, overrideAccess: true })
      const variant = Array.isArray(product.variants) ? product.variants.find((item: any) => String(item.id) === String(data.variantId || '')) : null
      const settings: any = await req.payload.findGlobal({ slug: 'marketing-settings', overrideAccess: true })
      const values = {
        brand: String(product.brand || 'Ginny Nana'),
        productName: String(product.title || ''),
        productType: String(product.category || 'Press-on Nails').replaceAll('-', ' '),
        length: String(variant?.length || product.length || ''),
        shape: String(variant?.shape || product.shape || ''),
        size: String(variant?.size || ''),
      }
      const apply = (template: string) => template.replace(/\{(brand|productName|productType|length|shape|size)\}/g, (_, key) => values[key as keyof typeof values] || '').replace(/\s+/g, ' ').trim()
      if (!String(data.title || '').trim()) data.title = apply(String(settings.pinterestTitleTemplate || '{productName} {length} {shape} Press-on Nails'))
      if (!String(data.description || '').trim()) data.description = apply(String(settings.pinterestDescriptionTemplate || 'Shop {productName} press-on nails by {brand}. {length} length, {shape} shape.'))
      data.link = pinterestProductLink(product, variant?.id, data.link)
      const media = [variant?.image, product.featuredImage, ...(Array.isArray(product.gallery) ? product.gallery : [])].find((item: any) => item && typeof item === 'object' && item.url)
      if (!data.imageURL) data.imageURL = media?.url || ''
      if (!data.imageMedia) {
        if (media?.id) data.imageMedia = media.id
      }
      return data
    }],
  },
  fields: [
    { name: 'product', type: 'relationship', relationTo: 'products', required: true },
    { name: 'variantId', type: 'text', admin: { description: 'Optional variant ID. Include it to use that variant image and add a variant link.' } },
    { name: 'title', type: 'text', required: true, maxLength: 100, admin: { description: 'Leave blank to use the Pinterest title template in Marketing settings.' } },
    { name: 'description', type: 'textarea', maxLength: 500, admin: { description: 'Leave blank to use the Pinterest description template.' } },
    { name: 'link', type: 'text', required: true },
    { name: 'imageURL', type: 'text', required: true, admin: { description: 'Must be publicly accessible over HTTPS for Pinterest to fetch.' } },
    { name: 'imageMedia', type: 'relationship', relationTo: 'media', admin: { hidden: true } },
    { name: 'scheduledAt', type: 'date', required: true, index: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'status', type: 'select', required: true, defaultValue: 'scheduled', index: true, options: ['draft', 'scheduled', 'published', 'failed'] },
    { name: 'pinId', type: 'text', admin: { readOnly: true } },
    { name: 'publishedAt', type: 'date', admin: { readOnly: true } },
    { name: 'lastError', type: 'textarea', admin: { readOnly: true } },
  ],
}
