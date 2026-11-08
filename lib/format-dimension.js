export function formatDimension(value) {
  if (value === 'quantity') return 'Pack quantity'
  return String(value || '').replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}
