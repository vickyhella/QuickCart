export const DEFAULT_NEW_ARRIVAL_DAYS = 30

export function isStorefrontNew(product: { storefrontIsNew?: unknown; isNew?: unknown } | null | undefined) {
  return Boolean(product?.storefrontIsNew ?? product?.isNew)
}

export function isWithinNewArrivalDays(publishedAt: unknown, daysValue: unknown, now = Date.now()) {
  const days = Number(daysValue)
  const publishedAtTime = typeof publishedAt === 'string' || publishedAt instanceof Date
    ? new Date(publishedAt).getTime()
    : Number.NaN

  if (!Number.isInteger(days) || days <= 0 || !Number.isFinite(publishedAtTime)) return false

  const age = now - publishedAtTime
  return age >= 0 && age <= days * 24 * 60 * 60 * 1000
}
