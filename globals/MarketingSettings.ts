import type { GlobalConfig } from 'payload'
import { shippingCountries } from '../lib/countries'

export const MarketingSettings: GlobalConfig = {
  slug: 'marketing-settings',
  label: 'Marketing settings',
  admin: { group: false },
  access: {
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Countries',
          fields: [{
            name: 'availableCountries',
            type: 'select',
            hasMany: true,
            defaultValue: ['US', ...shippingCountries.filter(([code]) => code !== 'US').map(([code]) => code)],
            options: shippingCountries.map(([value, label]) => ({ value, label: `${label} (${value})` })),
            admin: { description: 'Used for checkout availability and GMC feed planning. Keep this in sync with the target countries and shipping services configured in Merchant Center.' },
          }],
        },
        {
          label: 'SEO & Media',
          fields: [
            { name: 'productTitleTemplate', type: 'text', defaultValue: '{brand} {productType} {productName} {length} {shape}', admin: { description: 'Tokens: {brand}, {productType}, {productName}, {length}, {shape}, {size}.' } },
            { name: 'productDescriptionTemplate', type: 'textarea', defaultValue: '{productName} press-on nails by {brand}.', admin: { description: 'Used when a product SEO description is blank.' } },
            { name: 'imageFilenameTemplate', type: 'text', defaultValue: '{brand}-{productType}-{productName}-{length}-{shape}-{number}', admin: { description: 'Tokens include {brand}, {productType}, {productName}, {length}, {shape}, and {number}.' } },
            { name: 'imageTitleTemplate', type: 'text', defaultValue: '{brand} {productName} {length} {shape} press-on nails' },
            { name: 'imageAltTemplate', type: 'text', defaultValue: '{brand} {productName} press-on nails in {length} length and {shape} shape' },
            { name: 'imageCaptionTemplate', type: 'text', defaultValue: '{productName} press-on nails by {brand}' },
            { name: 'compressImagesToWebP', type: 'checkbox', defaultValue: true, admin: { description: 'Convert uploaded JPEG and PNG product images to WebP using Sharp.' } },
            { name: 'webpQuality', type: 'number', min: 1, max: 100, defaultValue: 82, admin: { description: 'WebP quality from 1 to 100. A value around 80–85 is a practical starting point.' } },
          ],
        },
        {
          label: 'Pinterest publishing',
          fields: [
            { name: 'pinterestTitleTemplate', type: 'text', defaultValue: '{productName} {length} {shape} Press-on Nails', admin: { description: 'Tokens: {brand}, {productName}, {productType}, {length}, {shape}, {size}.' } },
            { name: 'pinterestDescriptionTemplate', type: 'textarea', defaultValue: 'Shop {productName} press-on nails by {brand}. {length} length, {shape} shape.', admin: { description: 'Requires PINTEREST_ACCESS_TOKEN and PINTEREST_BOARD_ID in your hosting environment. Cron publishing also requires CRON_SECRET.' } },
            { name: 'pinterestPublishingSetup', type: 'textarea', admin: { readOnly: true, description: 'Pinterest publishing setup instructions.' } },
          ],
        },
      ],
    },
  ],
}
