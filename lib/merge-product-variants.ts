type Variant = Record<string, any>

const keyOf = (variant: Variant) => `${variant.length}|${variant.shape}|${variant.size}`

export function mergeProductVariants(existing: Variant[], selected: Variant[]) {
  const byKey = new Map(existing.map((variant) => [keyOf(variant), variant]))
  const selectedKeys = new Set(selected.map(keyOf))
  return [
    ...selected.map((variant) => ({ ...(byKey.get(keyOf(variant)) || {}), ...variant, enabled: variant.enabled !== false })),
    ...existing.filter((variant) => !selectedKeys.has(keyOf(variant))).map((variant) => ({ ...variant, enabled: false })),
  ]
}
