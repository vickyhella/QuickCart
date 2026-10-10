import type { GlobalConfig } from 'payload'

export const StoreSettings: GlobalConfig = {
  slug: 'store-settings',
  label: 'Store settings',
  access: {
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'currency', type: 'select', required: true, defaultValue: 'USD', options: [{ label: 'USD ($)', value: 'USD' }] },
    { name: 'freeShippingThreshold', type: 'number', required: true, min: 0, defaultValue: 50, admin: { description: 'Orders at or above this subtotal receive free shipping.' } },
    { name: 'flatShippingRate', type: 'number', required: true, min: 0, defaultValue: 0, admin: { description: 'Shipping charged below the free-shipping threshold. Set the actual amount before launch.' } },
    {
      name: 'shippingTiers',
      type: 'array',
      labels: { singular: 'Shipping tier', plural: 'Shipping tiers' },
      admin: {
        description: 'Optional order-value and item-count ranges. The first matching tier is used; free shipping threshold takes priority.',
        initCollapsed: false,
      },
      fields: [
        { name: 'minimumSubtotal', label: 'Minimum order subtotal', type: 'number', min: 0 },
        { name: 'maximumSubtotal', label: 'Maximum order subtotal', type: 'number', min: 0 },
        { name: 'minimumItems', label: 'Minimum item quantity', type: 'number', min: 0 },
        { name: 'maximumItems', label: 'Maximum item quantity', type: 'number', min: 0 },
        { name: 'fee', label: 'Shipping fee', type: 'number', required: true, min: 0 },
      ],
    },
    { name: 'pricesIncludeTax', type: 'checkbox', defaultValue: true, admin: { description: 'When enabled, no additional tax is added during checkout.' } },
  ],
}
