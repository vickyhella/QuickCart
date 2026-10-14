type MediaRecord = {
  id: string | number
  filename?: string | null
  mimeType?: string | null
  title?: string | null
  url?: string | null
  prefix?: string | null
}

export async function resolveStudioProductMedia(
  records: MediaRecord[],
  options: { r2PublicURL?: string; requestURL: string; fetcher?: typeof fetch },
) {
  const fetcher = options.fetcher || fetch
  const r2PublicURL = options.r2PublicURL?.replace(/\/$/, '')
  const uniqueRecords = [...new Map(records.filter(Boolean).map((record) => [String(record.id), record])).values()]
  const candidates: { id: string | number; url: string; name: string }[] = []
  const seenURLs = new Set<string>()
  let unavailableCount = 0

  for (const record of uniqueRecords) {
    if (record.mimeType !== 'image/webp') {
      unavailableCount++
      continue
    }

    const filename = String(record.filename || '')
    const key = [record.prefix, filename].filter(Boolean).join('/')
    const storedURL = String(record.url || '')
    const url = r2PublicURL && key
      ? storedURL.startsWith(`${r2PublicURL}/`) ? storedURL : `${r2PublicURL}/${key}`
      : storedURL
    if (!url) {
      unavailableCount++
      continue
    }
    if (seenURLs.has(url)) continue
    seenURLs.add(url)
    candidates.push({ id: record.id, url, name: filename || record.title || 'Product image' })
  }

  const checked = await Promise.all(candidates.map(async (candidate) => {
    try {
      const target = new URL(candidate.url, options.requestURL)
      if (!r2PublicURL && target.origin !== new URL(options.requestURL).origin) return candidate
      const response = await fetcher(target, { method: 'HEAD', cache: 'no-store' })
      if (response.status === 404) {
        return null
      }
    } catch {
      // Keep media during transient network failures; only confirmed 404s are treated as missing.
    }
    return candidate
  }))
  const media = checked.filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
  unavailableCount += checked.length - media.length

  return { media, unavailableCount }
}
