const sizeOrder = ['xs', 's', 'm', 'l']

export function sortProductSizes(sizes: string[]) {
  return [...new Set(sizes)].sort((a, b) => {
    const left = sizeOrder.indexOf(a)
    const right = sizeOrder.indexOf(b)
    return (left < 0 ? sizeOrder.length : left) - (right < 0 ? sizeOrder.length : right)
  })
}

export function orderedVariantRows<T>(combinations: T[], sizes: string[]) {
  return sortProductSizes(sizes).flatMap((size) => combinations.map((combo) => ({ combo, size })))
}
