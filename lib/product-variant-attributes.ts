export function validateProductVariantAttributes(value: unknown, dimensions: unknown): Record<string, string | number> {
  if (value === undefined || value === null) return {}
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('Variant attributes must be an object.')
  const available = Array.isArray(dimensions) ? dimensions : []
  return Object.fromEntries(Object.entries(value).map(([key, attribute]) => {
    const dimension = available.find((item: any) => item?.key === key) as any
    if (!dimension) throw new Error(`Unknown variant dimension: ${key}.`)
    if (dimension.valueType === 'integer') {
      if (typeof attribute !== 'number' || !Number.isSafeInteger(attribute) || attribute < 1) throw new Error(`${dimension.label} must be a positive whole number.`)
    } else if (typeof attribute !== 'string' || !attribute.trim()) {
      throw new Error(`${dimension.label} must be text.`)
    }
    return [key, attribute]
  }))
}
