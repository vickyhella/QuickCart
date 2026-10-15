import { getEnvironmentVariable } from './environment-config'

type ProductReference = { id: string | number; slug?: string | null }

export function pinterestProductLink(
  product: ProductReference,
  variantID?: string | number | null,
  link?: string | null,
  siteURL = getEnvironmentVariable('NEXT_PUBLIC_SITE_URL') || 'https://ginnynana.com',
) {
  const configuredURL = new URL(siteURL)
  const baseURL = ['localhost', '127.0.0.1', '::1'].includes(configuredURL.hostname)
    ? 'https://ginnynana.com/'
    : `${siteURL.replace(/\/+$/, '')}/`
  const productPath = `/product/${encodeURIComponent(String(product.slug || product.id))}`
  const fallback = `${productPath}${variantID ? `?variant=${encodeURIComponent(String(variantID))}` : ''}`
  return new URL(String(link || fallback).trim(), baseURL).toString()
}
