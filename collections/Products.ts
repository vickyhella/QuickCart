import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  access: {
    read: ({ req }) =>
      req.user ? true : { status: { equals: 'published' } },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'sku', 'price', 'status', 'updatedAt'],
    description: 'Manage press-on nail designs, images, prices, and publishing status.',
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    { name: 'sku', type: 'text', admin: { position: 'sidebar' } },
    { name: 'brand', type: 'text', defaultValue: 'Ginny Nana', admin: { position: 'sidebar' } },
    { name: 'gtin', type: 'text', admin: { position: 'sidebar', description: 'Optional global trade item number. Leave blank if this handmade product has no GTIN.' } },
    { name: 'mpn', type: 'text', admin: { position: 'sidebar', description: 'Optional manufacturer part number, if the product has one.' } },
    { name: 'googleProductCategory', type: 'text', admin: { position: 'sidebar', description: 'Optional Google product category for Merchant Center.' } },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      admin: { rows: 5 },
    },
    { name: 'price', type: 'number', required: true, min: 0 },
    {
      name: 'compareAtPrice',
      type: 'number',
      min: 0,
      admin: { description: 'Optional original price, shown crossed out.' },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'press-on-nails',
      options: [
        { label: 'Press-on Nails', value: 'press-on-nails' },
        { label: 'Nail Care', value: 'nail-care' },
        { label: 'Accessories', value: 'accessories' },
        { label: 'Mystery Box', value: 'mystery-box' },
      ],
    },
    {
      name: 'length',
      type: 'select',
      options: [
        { label: 'X-Short (around 15mm)', value: 'x-short' },
        { label: 'Short (around 18mm)', value: 'short' },
        { label: 'Medium (around 22mm)', value: 'medium' },
        { label: 'Long (around 26mm)', value: 'long' },
        { label: 'X-Long (around 35mm)', value: 'x-long' },
      ],
    },
    {
      name: 'shape',
      type: 'select',
      options: [
        { label: 'Square', value: 'square' },
        { label: 'Oval', value: 'oval' },
        { label: 'Almond', value: 'almond' },
        { label: 'Round', value: 'round' },
      ],
    },
    {
      name: 'variants',
      type: 'array',
      labels: { singular: 'Variant', plural: 'Variants' },
      admin: {
        description: 'Create one row for each shape and length customers can choose. Leave variant prices blank to use the product price.',
      },
      fields: [
        { name: 'sku', type: 'text', required: true, index: true },
        {
          name: 'length',
          type: 'select',
          required: true,
          options: [
            { label: 'X-Short', value: 'x-short' },
            { label: 'Short', value: 'short' },
            { label: 'Medium', value: 'medium' },
            { label: 'Long', value: 'long' },
            { label: 'X-Long', value: 'x-long' },
          ],
        },
        {
          name: 'shape',
          type: 'select',
          required: true,
          options: [
            { label: 'Square', value: 'square' },
            { label: 'Oval', value: 'oval' },
            { label: 'Almond', value: 'almond' },
            { label: 'Round', value: 'round' },
          ],
        },
        { name: 'price', type: 'number', min: 0 },
        { name: 'compareAtPrice', type: 'number', min: 0 },
        { name: 'gtin', type: 'text' },
        { name: 'mpn', type: 'text' },
        { name: 'stock', type: 'number', min: 0, defaultValue: 0 },
        { name: 'trackStock', type: 'checkbox', defaultValue: false },
        { name: 'enabled', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'gallery',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'isNew', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    { name: 'isBestSeller', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
  ],
}
