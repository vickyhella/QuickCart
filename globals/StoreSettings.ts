import type { GlobalConfig } from 'payload'
import { shippingCountries } from '../lib/countries'

export const StoreSettings: GlobalConfig = {
  slug: 'store-settings',
  label: 'Store settings',
  admin: { group: 'Commerce' },
  access: {
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
  },
  hooks: {
    afterRead: [async ({ doc, req }) => {
      if (Array.isArray(doc.availableCountries) && doc.availableCountries.length) return doc
      const marketing = await req.payload.findGlobal({ slug: 'marketing-settings', overrideAccess: true }).catch(() => null)
      return { ...doc, availableCountries: marketing?.availableCountries?.length ? marketing.availableCountries : doc.availableCountries || [] }
    }],
    afterChange: [async ({ doc, req }) => {
      if (Array.isArray(doc.availableCountries)) {
        await req.payload.updateGlobal({ slug: 'marketing-settings', data: { availableCountries: doc.availableCountries }, overrideAccess: true })
      }
      return doc
    }],
  },
  fields: [
    { name: 'currency', type: 'select', required: true, defaultValue: 'USD', options: [{ label: 'USD ($)', value: 'USD' }] },
    { name: 'freeShippingThreshold', label: 'Free shipping over a specific order value', type: 'number', min: 0, defaultValue: 50, admin: { description: 'Leave blank to disable this order value condition.' } },
    { name: 'minimumOrderValue', label: 'No shipping below a specific order value', type: 'number', min: 0, admin: { description: 'Orders below this value cannot be checked out. Leave blank to disable this condition.' } },
    {
      name: 'shippingCostType',
      label: 'Shipping cost for orders under the free shipping threshold',
      type: 'radio',
      enumName: 'enum_store_settings_shipping_cost_type',
      required: true,
      defaultValue: 'flat',
      options: [
        { label: 'Free shipping — All orders get free shipping', value: 'free' },
        { label: 'Flat rate — All orders have the same shipping fee', value: 'flat' },
        { label: 'Price — Shipping rate is dependent on product price', value: 'price' },
        { label: 'Weight — Shipping rate is determined by package weight', value: 'weight' },
        { label: 'Number of items — Shipping rate depends on quantity', value: 'items' },
        { label: 'Advanced cost table (uncommon) — Shipping rate depends on multiple factors', value: 'advanced' },
      ],
      admin: { layout: 'vertical', description: 'Choose the same rate type you use in Google Merchant Center.' },
    },
    { name: 'flatShippingRate', label: 'Flat shipping fee', type: 'number', min: 0, validate: (value, { data }) => data?.shippingCostType !== 'flat' || (value != null && value !== '' && Number(value) >= 0) || 'Enter the flat shipping fee.', admin: { condition: (data) => data?.shippingCostType === 'flat' } },
    { name: 'shippingAdvancedDimension1', label: 'First dimension', type: 'select', enumName: 'enum_store_settings_shipping_advanced_dimension1', defaultValue: 'price', options: [{ label: 'Price', value: 'price' }, { label: 'Weight', value: 'weight' }, { label: 'Number of items', value: 'items' }], validate: (value, { data }) => data?.shippingCostType !== 'advanced' || Boolean(value) || 'Choose the first dimension.', admin: { condition: (data) => data?.shippingCostType === 'advanced' } },
    {
      name: 'shippingAdvancedDimension2',
      label: 'Second dimension',
      type: 'select',
      enumName: 'enum_store_settings_shipping_advanced_dimension2',
      defaultValue: 'items',
      options: [{ label: 'Price', value: 'price' }, { label: 'Weight', value: 'weight' }, { label: 'Number of items', value: 'items' }],
      validate: (value, { data }) => data?.shippingCostType !== 'advanced' || (Boolean(value) && value !== data?.shippingAdvancedDimension1) || 'Choose a second, different dimension.',
      admin: { condition: (data) => data?.shippingCostType === 'advanced' },
    },
    {
      name: 'shippingTiers',
      type: 'array',
      label: 'Shipping rate table',
      labels: { singular: 'Rate range', plural: 'Rate ranges' },
      admin: {
        condition: (data) => ['price', 'weight', 'items', 'advanced'].includes(data?.shippingCostType),
        description: 'Enter a cost for each range. Weight is measured in kilograms (kg). Leave the maximum empty for “and above”. In the advanced table, each row combines the selected dimensions.',
        initCollapsed: false,
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'minimumSubtotal', label: 'From order value ($)', type: 'number', min: 0, admin: { condition: (data) => data?.shippingCostType === 'price' || (data?.shippingCostType === 'advanced' && [data?.shippingAdvancedDimension1, data?.shippingAdvancedDimension2].includes('price')) } },
            { name: 'maximumSubtotal', label: 'To order value ($)', type: 'number', min: 0, admin: { condition: (data) => data?.shippingCostType === 'price' || (data?.shippingCostType === 'advanced' && [data?.shippingAdvancedDimension1, data?.shippingAdvancedDimension2].includes('price')) } },
            { name: 'minimumWeightKg', label: 'From weight (kg)', type: 'number', min: 0, admin: { condition: (data) => data?.shippingCostType === 'weight' || (data?.shippingCostType === 'advanced' && [data?.shippingAdvancedDimension1, data?.shippingAdvancedDimension2].includes('weight')) } },
            { name: 'maximumWeightKg', label: 'To weight (kg)', type: 'number', min: 0, admin: { condition: (data) => data?.shippingCostType === 'weight' || (data?.shippingCostType === 'advanced' && [data?.shippingAdvancedDimension1, data?.shippingAdvancedDimension2].includes('weight')) } },
            { name: 'minimumItems', label: 'From number of items', type: 'number', min: 0, admin: { condition: (data) => data?.shippingCostType === 'items' || (data?.shippingCostType === 'advanced' && [data?.shippingAdvancedDimension1, data?.shippingAdvancedDimension2].includes('items')) } },
            { name: 'maximumItems', label: 'To number of items', type: 'number', min: 0, admin: { condition: (data) => data?.shippingCostType === 'items' || (data?.shippingCostType === 'advanced' && [data?.shippingAdvancedDimension1, data?.shippingAdvancedDimension2].includes('items')) } },
            { name: 'fee', label: 'Cost ($)', type: 'number', required: true, min: 0 },
          ],
        },
      ],
    },
    { name: 'pricesIncludeTax', type: 'checkbox', defaultValue: true, admin: { description: 'When enabled, no additional tax is added during checkout.' } },
    {
      name: 'availableCountries',
      label: 'Countries available for checkout',
      type: 'select',
      hasMany: true,
      options: shippingCountries.map(([value, label]) => ({ value, label: `${label} (${value})` })),
      admin: { description: 'Countries available at checkout. This also controls the country scope shown in product feeds.' },
    },
  ],
}
