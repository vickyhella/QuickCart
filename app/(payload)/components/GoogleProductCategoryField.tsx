'use client'

import { useField } from '@payloadcms/ui'

const categories = [
  {
    label: 'False Nails (recommended)',
    value: 'Health & Beauty > Personal Care > Cosmetics > Nail Care > False Nails',
  },
  {
    label: 'Nail Care',
    value: 'Health & Beauty > Personal Care > Cosmetics > Nail Care',
  },
  {
    label: 'Nail Polish',
    value: 'Health & Beauty > Personal Care > Cosmetics > Nail Care > Nail Polish',
  },
  {
    label: 'Cosmetics',
    value: 'Health & Beauty > Personal Care > Cosmetics',
  },
]

export function GoogleProductCategoryField({ path, readOnly }: { path: string; readOnly?: boolean }) {
  const { value, setValue } = useField<string>({ path })

  return (
    <div className="field-type select">
      <label className="field-label" htmlFor={path}>Google product category</label>
      <select
        className="field-input"
        id={path}
        value={typeof value === 'string' ? value : categories[0].value}
        onChange={(event) => setValue(event.currentTarget.value)}
        disabled={readOnly}
      >
        {categories.map((category) => (
          <option key={category.value} value={category.value}>{category.label}</option>
        ))}
      </select>
      <div className="field-description">Choose the closest matching Google taxonomy category.</div>
    </div>
  )
}
