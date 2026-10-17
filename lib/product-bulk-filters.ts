type ProductFilterRow = { title: string; chineseName: string; sku: string; status: string; category: string; shape: string; length: string; color: string; brand: string }
type ProductBulkFilters = { status: string; category: string; shape: string; length: string; color: string; brand: string }

export function matchesProductBulkFilters(row: ProductFilterRow, search: string, filters: ProductBulkFilters) {
  const needle = search.trim().toLowerCase()
  const hasDimension = (value: string, selected: string) => !selected || value.split(',').some((part) => part.trim().toLowerCase() === selected.toLowerCase())
  return (!needle || row.title.toLowerCase().includes(needle) || row.chineseName.toLowerCase().includes(needle) || row.sku.toLowerCase().includes(needle))
    && (!filters.status || row.status === filters.status)
    && (!filters.category || row.category === filters.category)
    && hasDimension(row.shape, filters.shape)
    && hasDimension(row.length, filters.length)
    && (!filters.color || row.color === filters.color)
    && (!filters.brand || row.brand === filters.brand)
}
