import { isAdminUser } from '../lib/admin-access'
import type { CollectionConfig } from 'payload'
import { getOrderEmailEvents, sendOrderEmail } from '../lib/order-email.js'

export const Orders: CollectionConfig = {
  slug: 'orders',
  access: {
    read: ({ req }) => isAdminUser(req.user),
    create: () => false,
    update: ({ req }) => isAdminUser(req.user),
    delete: ({ req }) => isAdminUser(req.user),
  },
  admin: {
    group: 'Commerce',
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'customerEmail', 'total', 'paymentStatus', 'fulfillmentStatus', 'createdAt'],
    description: 'Customer orders and fulfillment status.',
  },
  hooks: {
    afterChange: [async ({ doc, previousDoc }) => {
      for (const type of getOrderEmailEvents(doc, previousDoc)) {
        try {
          const result = await sendOrderEmail(doc, type)
          if (!result.sent) console.info(`Order ${type} email skipped: email service is not configured.`)
        } catch (error) {
          console.error(`Order ${type} email failed for ${doc.orderNumber}:`, error)
        }
      }
      return doc
    }],
  },
  fields: [
    { name: 'orderNumber', type: 'text', required: true, unique: true, index: true },
    { name: 'customerEmail', type: 'email', required: true },
    { name: 'currency', type: 'text', required: true, defaultValue: 'USD' },
    {
      name: 'items',
      type: 'array',
      required: true,
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products' },
        { name: 'title', type: 'text', required: true },
        { name: 'sku', type: 'text' },
        { name: 'variant', type: 'text' },
        { name: 'variantId', type: 'text' },
        { name: 'quantity', type: 'number', required: true, min: 1 },
        { name: 'unitPrice', type: 'number', required: true, min: 0 },
      ],
    },
    {
      name: 'shippingAddress',
      type: 'group',
      fields: [
        { name: 'fullName', type: 'text', required: true },
        { name: 'phone', type: 'text' },
        { name: 'address1', type: 'text', required: true },
        { name: 'address2', type: 'text' },
        { name: 'city', type: 'text', required: true },
        { name: 'state', type: 'text' },
        { name: 'postalCode', type: 'text', required: true },
        { name: 'country', type: 'text', required: true },
      ],
    },
    { name: 'subtotal', type: 'number', required: true, min: 0 },
    { name: 'shippingTotal', type: 'number', required: true, min: 0, defaultValue: 0 },
    { name: 'taxTotal', type: 'number', required: true, min: 0, defaultValue: 0 },
    { name: 'discountTotal', type: 'number', required: true, min: 0, defaultValue: 0 },
    { name: 'total', type: 'number', required: true, min: 0 },
    { name: 'promoCode', type: 'text' },
    {
      name: 'paymentProvider',
      type: 'select',
      options: [
        { label: 'Stripe', value: 'stripe' },
        { label: 'PayPal', value: 'paypal' },
      ],
    },
    { name: 'paymentReference', type: 'text', index: true },
    {
      name: 'paymentStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Failed', value: 'failed' },
        { label: 'Refunded', value: 'refunded' },
      ],
    },
    {
      name: 'fulfillmentStatus',
      type: 'select',
      required: true,
      defaultValue: 'unfulfilled',
      options: [
        { label: 'Unfulfilled', value: 'unfulfilled' },
        { label: 'Processing', value: 'processing' },
        { label: 'Shipped', value: 'shipped' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    { name: 'trackingNumber', type: 'text' },
    {
      name: 'trackingUrl',
      type: 'text',
      label: 'Tracking URL',
      validate: (value) => !value || /^https?:\/\/\S+$/i.test(String(value)) || 'Enter a full http or https tracking URL.',
      admin: { description: 'Optional courier tracking link included in the customer shipment email.' },
    },
    { name: 'customerNote', type: 'textarea' },
  ],
}
