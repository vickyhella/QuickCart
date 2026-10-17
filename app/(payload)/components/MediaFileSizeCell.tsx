export function MediaFileSizeCell({ cellData }: { cellData?: unknown }) {
  const bytes = Number(cellData)
  if (!Number.isFinite(bytes) || bytes <= 0) return <>—</>
  const size = bytes / 1024
  return <>{size >= 1024 ? `${(size / 1024).toFixed(2)} MB` : `${size.toFixed(1)} KB`}</>
}
