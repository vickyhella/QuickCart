import type { CollectionConfig } from 'payload'
import { getPublishedProductMediaIDs } from '@/lib/public-product-media'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: async ({ req }) => {
      if (req.user) return true
      const { docs } = await req.payload.find({
        collection: 'products',
        where: { status: { equals: 'published' } },
        limit: 10000,
        pagination: false,
        depth: 0,
        overrideAccess: true,
      })
      const ids = getPublishedProductMediaIDs(docs)
      return ids.length ? { id: { in: ids } } : false
    },
    delete: () => false,
  },
  hooks: {
    beforeDelete: [async ({ id, req }) => {
      const scheduledPosts = await req.payload.find({ collection: 'pinterest-posts', where: { imageMedia: { equals: String(id) } }, limit: 10000, pagination: false, depth: 0, overrideAccess: true })
      for (const post of scheduledPosts.docs as any[]) {
        if (post.status === 'scheduled') await req.payload.update({ collection: 'pinterest-posts', id: post.id, data: { status: 'failed', lastError: 'The linked product image was deleted. Choose a replacement image and schedule the post again.' }, overrideAccess: true })
      }
      const products = await req.payload.find({ collection: 'products', limit: 10000, pagination: false, depth: 0, overrideAccess: true })
      const mediaID = String(id)
      const relationID = (value: any) => String(value && typeof value === 'object' ? value.id : value ?? '')
      for (const product of products.docs as any[]) {
        const data: Record<string, unknown> = {}
        if (relationID(product.featuredImage) === mediaID) data.featuredImage = null
        if (Array.isArray(product.gallery) && product.gallery.some((item: any) => relationID(item) === mediaID)) {
          data.gallery = product.gallery.filter((item: any) => relationID(item) !== mediaID).map((item: any) => relationID(item))
        }
        if (Array.isArray(product.variants) && product.variants.some((variant: any) => relationID(variant.image) === mediaID)) {
          data.variants = product.variants.map((variant: any) => relationID(variant.image) === mediaID ? { ...variant, image: null } : variant)
        }
        if (Object.keys(data).length) {
          await req.payload.update({ collection: 'products', id: product.id, data, depth: 0, overrideAccess: true })
        }
      }
    }],
    beforeValidate: [async ({ data, req }) => {
      if (!data) return data
      if (req.context?.skipMediaOptimization) return data
      if (req.context?.skipMediaMetadata) return data
      const marketing = await req.payload.findGlobal({ slug: 'marketing-settings', overrideAccess: true }).catch(() => null)
      const productID = typeof data.product === 'object' && data.product ? data.product.id : data.product
      const product = productID ? await req.payload.findByID({ collection: 'products', id: String(productID), depth: 0, overrideAccess: true }).catch(() => null) : null
      const filename = String(req.file?.name || data.filename || '')
      const name = String(product?.title || filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') || 'Product image')
      const values = { brand: String(product?.brand || 'Ginny Nana'), productType: String(product?.category || 'press-on-nails').replaceAll('-', ' '), productName: name, length: String(product?.length || ''), shape: String(product?.shape || ''), size: '' }
      const apply = (template: string) => template.replace(/\{(brand|productType|productName|length|shape|size)\}/g, (_, token) => values[token] || '').replace(/\s+/g, ' ').trim()
      if (req.file?.name) {
        const ext = req.file.name.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() || ''
        const template = String(marketing?.imageFilenameTemplate || '{brand}-{productType}-{productName}-{length}-{shape}-{number}')
        const base = apply(template.replace(/\{number\}/g, '')).replace(/[-_\s]+$/g, '').replace(/[^a-z0-9-]+/gi, '-').replace(/-+/g, '-').toLowerCase() || 'product-image'
        let sequence = 1
        let filename = ''
        do {
          const number = String(sequence++).padStart(2, '0')
          const generated = template.includes('{number}') ? apply(template.replace('{number}', number)) : `${apply(template)}-${number}`
          const slug = generated.replace(/[^a-z0-9-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() || base
          filename = `${slug}${ext}`
          const collision = await req.payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1, depth: 0, overrideAccess: true })
          if (!collision.docs.length) break
        } while (sequence < 10000)
        req.file.name = filename
      }
      if (!String(data.title || '').trim()) data.title = product?.title || apply(String(marketing?.imageTitleTemplate || '{brand} {productName} {length} {shape} press-on nails'))
      if (!String(data.altText || '').trim()) data.altText = apply(String(marketing?.imageAltTemplate || '{brand} {productName} press-on nails in {length} length and {shape} shape'))
      if (!String(data.caption || '').trim()) data.caption = apply(String(marketing?.imageCaptionTemplate || '{productName} press-on nails by {brand}'))
      return data
    }],
  },
  admin: {
    group: 'Media',
    useAsTitle: 'title',
    defaultColumns: ['filename', 'filesize', 'title', 'altText', 'createdAt'],
    description: 'Reusable product images with editable search and accessibility metadata.',
    components: {
      beforeList: ['/components/MediaWorkspaceTabs#MediaWorkspaceTabs', '/components/MediaBulkUpload#MediaBulkUpload'],
      views: {
        compression: {
          Component: '/components/MediaToolsView#MediaCompressionView',
          path: '/compression',
          exact: true,
        },
        metadata: {
          Component: '/components/MediaToolsView#MediaMetadataView',
          path: '/metadata',
          exact: true,
        },
      },
      edit: { beforeDocumentControls: ['/components/MediaReprocessButton#MediaReprocessButton'] },
    },
  },
  upload: {
    staticDir: 'public/media',
    mimeTypes: ['image/*'],
  },
  fields: [
    { name: 'filesize', type: 'number', label: 'File size', admin: { hidden: false, readOnly: true, components: { Cell: '/components/MediaFileSizeCell#MediaFileSizeCell' } } },
    { name: 'title', type: 'text', admin: { description: 'Human-readable image title. Also useful for search and internal organization.' } },
    { name: 'altText', type: 'text', admin: { description: 'Describe the visible image for accessibility and Pinterest catalog metadata.' } },
    { name: 'caption', type: 'textarea', admin: { rows: 3 } },
    { name: 'product', type: 'relationship', relationTo: 'products', admin: { description: 'Optional product this image belongs to.' } },
    { name: 'studioTemporary', type: 'checkbox', defaultValue: false, admin: { hidden: true } },
    { name: 'sourceOriginal', type: 'relationship', relationTo: 'media-originals', admin: { readOnly: true, description: 'Untouched upload retained for future reprocessing.' } },
  ],
}
