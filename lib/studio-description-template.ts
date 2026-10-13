export const DEFAULT_STUDIO_DESCRIPTION_TEMPLATE = `**{productName}**

Discover {productName} by {brand}, a press-on nail style for your everyday look.

Available Length & Shape combinations: {availableLengthShapeCombinations}

Available sizes: {availableSizes}

Choose your preferred style and size before adding the product to your cart.`

export function renderStudioDescription(template: string, values: Record<string, string>) {
  return template.split('\n')
    .filter((line) => ![...line.matchAll(/\{([^}]+)\}/g)].some(([, key]) => !values[key]))
    .map((line) => line.replace(/\{([^}]+)\}/g, (_, key: string) => values[key] || ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
