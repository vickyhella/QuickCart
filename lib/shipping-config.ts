import settings from '../config/shipping.json'
import contentSources from '../config/content-sources.json'
import { shippingCountries } from './countries'

export const shippingSettings = settings
export const checkoutCountries = shippingCountries.filter(([code]) => settings.availableCountries.includes(code))
const handling = settings.handlingBusinessDays
const transit = settings.transitBusinessDays
export const shippingEstimate = `estimated ${handling.minimum + transit.minimum}–${handling.maximum + transit.maximum} business days including preparation`

export async function getShippingSettings(payload: { findGlobal: Function }) {
  if (contentSources.shipping === 'repository') return settings
  const saved = await payload.findGlobal({ slug: 'store-settings', depth: 0, overrideAccess: true })
  return {
    ...settings,
    ...saved,
    availableCountries: Array.isArray(saved.availableCountries) ? saved.availableCountries : settings.availableCountries,
    handlingBusinessDays: {
      minimum: Number(saved.handlingMinimumBusinessDays ?? settings.handlingBusinessDays.minimum),
      maximum: Number(saved.handlingMaximumBusinessDays ?? settings.handlingBusinessDays.maximum),
    },
    transitBusinessDays: {
      minimum: Number(saved.transitMinimumBusinessDays ?? settings.transitBusinessDays.minimum),
      maximum: Number(saved.transitMaximumBusinessDays ?? settings.transitBusinessDays.maximum),
    },
  }
}

export function shippingPolicyDetails(activeSettings: any = settings) {
  const activeHandling = activeSettings.handlingBusinessDays || handling
  const activeTransit = activeSettings.transitBusinessDays || transit
  const tiers = activeSettings.shippingTiers || []
  const amount = (value: number) => `${activeSettings.currency || 'USD'} ${Number(value).toFixed(2)}`
  const costType = activeSettings.shippingCostType || 'weight'
  const dimensionName: Record<string, string> = { price: 'Order value', weight: 'Weight (kg)', items: 'Items' }
  const dimensionSuffix: Record<string, string> = { price: 'Subtotal', weight: 'WeightKg', items: 'Items' }
  const range = (minimum: any, maximum: any, decimals = 2) => `${Number(minimum || 0).toFixed(decimals)}–${maximum == null ? 'No upper limit' : Number(maximum).toFixed(decimals)}`
  const rows = costType === 'free'
    ? [`| All orders | Free |`]
    : costType === 'flat'
      ? [`| All orders | ${Number(activeSettings.flatShippingRate || 0) === 0 ? 'Free' : amount(activeSettings.flatShippingRate)} |`]
      : tiers.map((tier: any) => {
        let rule = ''
        if (costType === 'weight') rule = `${range(tier.minimumWeightKg, tier.maximumWeightKg, 4)} kg`
        else if (costType === 'price') rule = range(tier.minimumSubtotal, tier.maximumSubtotal)
        else if (costType === 'items') rule = range(tier.minimumItems, tier.maximumItems, 0)
        else {
          const first = activeSettings.shippingAdvancedDimension1
          const second = activeSettings.shippingAdvancedDimension2
          rule = `${dimensionName[first]} ${range(tier[`minimum${dimensionSuffix[first]}`], tier[`maximum${dimensionSuffix[first]}`])}; ${dimensionName[second]} ${range(tier[`minimum${dimensionSuffix[second]}`], tier[`maximum${dimensionSuffix[second]}`], second === 'weight' ? 4 : second === 'items' ? 0 : 2)}`
        }
        return `| ${rule} | ${Number(tier.fee) === 0 ? 'Free' : amount(tier.fee)} |`
      })
  const tableHeading = costType === 'price' ? '| Order value range (USD) | Shipping cost |\n| --- | --- |'
      : costType === 'items' ? '| Item count range | Shipping cost |\n| --- | --- |'
        : costType === 'weight' ? '| Total weight range | Shipping cost |\n| --- | --- |'
          : '| Order type | Shipping cost |\n| --- | --- |'
  const countries = (activeSettings.availableCountries || settings.availableCountries).map((code: string) => shippingCountries.find(([countryCode]) => countryCode === code)).filter(Boolean)
  const freeThreshold = activeSettings.freeShippingThreshold
  const thresholdDescription = freeThreshold == null || freeThreshold === ''
    ? 'No merchandise subtotal threshold is required for free shipping.'
    : `Orders with a merchandise subtotal of **${amount(freeThreshold)} or more after discounts** qualify for free shipping. Shipping charges are not included in that threshold.`
  const minimumOrderValue = activeSettings.minimumOrderValue
  return [
    '## Shipping rates',
    thresholdDescription,
    ...(minimumOrderValue == null || minimumOrderValue === '' ? [] : [`Orders must have a merchandise subtotal of at least **${amount(minimumOrderValue)}** to be eligible for shipping.`]),
    'For orders below this threshold, the following rates apply to all supported destinations:',
    tableHeading,
    ...rows,
    ...(costType === 'weight' ? ['Total package weight is calculated from the weight of each product multiplied by its quantity, rounded up to four decimal places in kilograms. The final shipping charge is shown before payment at checkout.'] : ['The final shipping charge is shown before payment at checkout.']),
    '## Preparation and delivery',
    `- Preparation before dispatch: **${activeHandling.minimum}–${activeHandling.maximum} business days**.`,
    `- Estimated transit after dispatch: **${activeTransit.minimum}–${activeTransit.maximum} business days**.`,
    `- Estimated total from order to delivery: **${activeHandling.minimum + activeTransit.minimum}–${activeHandling.maximum + activeTransit.maximum} business days**.`,
    'These are estimates, not guaranteed delivery dates. Business days exclude weekends and public holidays. Carrier, customs and destination delays may affect delivery.',
    '## Supported destinations',
    countries.map(([, name]: any) => name).join(', ') + '.',
  ].join('\n\n').replace(/\|\n\n(?=\|)/g, '|\n')
}
