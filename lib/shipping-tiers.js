const ranges = {
  price: ['minimumSubtotal', 'maximumSubtotal'],
  weight: ['minimumWeightKg', 'maximumWeightKg'],
  items: ['minimumItems', 'maximumItems'],
}

export const matchesShippingRange = (value, minimum, maximum) =>
  value >= (minimum == null || minimum === '' ? 0 : Number(minimum))
  && (maximum == null || maximum === '' || value <= Number(maximum))

export function getTotalWeightKg(lines) {
  const total = lines.reduce((sum, { product, quantity }) => {
    const weightKg = Number(product.shippingWeight)
    return sum + (Number.isFinite(weightKg) && weightKg > 0 ? weightKg : 0.2) * quantity
  }, 0)
  return Math.ceil(total * 10000 - 1e-8) / 10000
}

export function findShippingTier(tiers, { type, primaryDimension, secondaryDimension, values }) {
  const dimensions = type === 'advanced'
    ? [...new Set([primaryDimension, secondaryDimension].filter((dimension) => ranges[dimension]))]
    : [type]
  if (!dimensions.length || dimensions.some((dimension) => !ranges[dimension])) return undefined
  return (tiers || []).find((tier) => dimensions.every((dimension) => {
    const [minimum, maximum] = ranges[dimension]
    return matchesShippingRange(values[dimension], tier[minimum], tier[maximum])
  }))
}

function findLegacyTier(tiers, settings, values) {
  const legacyRanges = {
    subtotal: ['minimumSubtotal', 'maximumSubtotal'],
    items: ['minimumItems', 'maximumItems'],
    weight: ['minimumWeightGrams', 'maximumWeightGrams'],
  }
  const basis = settings.shippingTierBasis
  const dimensions = basis && basis !== 'combined' && legacyRanges[basis]
    ? [basis]
    : Object.keys(legacyRanges)

  return (tiers || []).find((tier) => dimensions.every((dimension) => {
    const [minimum, maximum] = legacyRanges[dimension]
    const value = dimension === 'subtotal' ? values.price : dimension === 'weight' ? values.weight * 1000 : values.items
    return matchesShippingRange(value, tier[minimum], tier[maximum])
  }))
}

export function calculateShippingCharge(settings, { subtotal, quantity, lines }) {
  const values = { price: subtotal, items: quantity, weight: getTotalWeightKg(lines) }
  const minimumOrderValue = Number(settings.minimumOrderValue)
  if (settings.minimumOrderValue != null && settings.minimumOrderValue !== '' && subtotal < minimumOrderValue) {
    return { unavailable: true, reason: 'minimum-order-value' }
  }

  const freeShippingThreshold = Number(settings.freeShippingThreshold)
  if (settings.freeShippingThreshold != null && settings.freeShippingThreshold !== '' && subtotal >= freeShippingThreshold) {
    return { shippingTotal: 0 }
  }

  const type = settings.shippingCostType
  if (!type) {
    const tier = findLegacyTier(settings.shippingTiers, settings, values)
    return { shippingTotal: Number(tier?.fee ?? settings.flatShippingRate ?? 0) }
  }
  if (type === 'free') return { shippingTotal: 0 }
  if (type === 'flat') return { shippingTotal: Number(settings.flatShippingRate ?? 0) }

  const tier = findShippingTier(settings.shippingTiers, {
    type,
    primaryDimension: settings.shippingAdvancedDimension1,
    secondaryDimension: settings.shippingAdvancedDimension2,
    values,
  })
  return tier ? { shippingTotal: Number(tier.fee) } : { unavailable: true, reason: 'no-matching-rate' }
}
