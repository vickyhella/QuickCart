'use client'

import { useRouter } from 'next/navigation'
import StorefrontSelect from '@/components/StorefrontSelect'
import { formatDimension } from '@/lib/format-dimension'

export default function CatalogFilters({ filters, colors }) {
  const router = useRouter()
  const update = (key, value) => {
    const params = new URLSearchParams(window.location.search)
    params.delete('page')
    if (value) params.set(key, value)
    else params.delete(key)
    router.push('/all-products/' + (params.size ? `?${params}` : ''), { scroll: false })
  }
  const options = (label, values, format = formatDimension) =>
    [{ value: '', label }, ...values.map((value) => ({ value, label: format(value) }))]
  return <div className="storefront-filters">
    <StorefrontSelect ariaLabel="Filter by length" value={filters.length} active={Boolean(filters.length)} onChange={(value) => update('length', value)}
      options={options('All lengths', ['x-short', 'short', 'medium', 'long', 'x-long'])} />
    <StorefrontSelect ariaLabel="Filter by shape" value={filters.shape} active={Boolean(filters.shape)} onChange={(value) => update('shape', value)}
      options={options('All shapes', ['square', 'oval', 'almond', 'round'])} />
    <StorefrontSelect ariaLabel="Filter by color" value={filters.color} active={Boolean(filters.color)} onChange={(value) => update('color', value)}
      options={options('All colors', colors, (value) => value)} />
    <label className="ui-filter"><input type="checkbox" checked={filters.sale === 'true'} onChange={(event) => update('sale', event.target.checked ? 'true' : '')} /> On sale</label>
    <label className="ui-filter"><input type="checkbox" checked={filters.isNew === 'true'} onChange={(event) => update('isNew', event.target.checked ? 'true' : '')} /> New arrivals</label>
  </div>
}
