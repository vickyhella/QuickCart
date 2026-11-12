import { storefrontOrigin } from '@/lib/storefront-seo'

export default function robots() {
  return { rules: { userAgent: '*', allow: '/', disallow: '/admin/' }, sitemap: `${storefrontOrigin}/sitemap.xml` }
}
