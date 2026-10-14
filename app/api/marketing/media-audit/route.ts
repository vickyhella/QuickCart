import { access } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getEnvironmentVariable } from '@/lib/environment-config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function imageExists(image: any): Promise<boolean | null> {
  if (!image || typeof image !== 'object' || !image.url) return false
  const publicURL = getEnvironmentVariable('R2_PUBLIC_URL')?.replace(/\/$/, '')
  if (publicURL && String(image.url).startsWith(`${publicURL}/`)) {
    try {
      const response = await fetch(image.url, { method: 'HEAD', signal: AbortSignal.timeout(4000), cache: 'no-store' })
      return response.ok ? true : response.status === 404 ? false : null
    } catch {
      return null
    }
  }
  if (image.filename) {
    try {
      await access(path.join(process.cwd(), 'public', 'media', path.basename(String(image.filename))))
      return true
    } catch {
      return false
    }
  }
  return null
}

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const result = await payload.find({ collection: 'products', limit: 5000, pagination: false, depth: 1, sort: 'title', overrideAccess: true })
  const issues: Array<{ id: string; title: string; slug: string; slot: string; reason: string }> = []
  for (const product of result.docs as any[]) {
    const main = product.featuredImage && typeof product.featuredImage === 'object'
      ? product.featuredImage
      : Array.isArray(product.gallery) ? product.gallery.find((item: any) => item && typeof item === 'object') : null
    if (!main) {
      issues.push({ id: String(product.id), title: product.title || 'Untitled product', slug: product.slug || '', slot: 'Product image', reason: 'No featured or gallery image is assigned.' })
    } else if (await imageExists(main) === false) {
      issues.push({ id: String(product.id), title: product.title || 'Untitled product', slug: product.slug || '', slot: 'Product image', reason: `Image file is missing: ${main.filename || main.url}` })
    }
    for (const variant of Array.isArray(product.variants) ? product.variants : []) {
      if (!variant.image) continue
      if (await imageExists(variant.image) === false) {
        issues.push({ id: String(product.id), title: product.title || 'Untitled product', slug: product.slug || '', slot: `Variant ${[variant.shape, variant.length, variant.size].filter(Boolean).join(' / ')}`, reason: `Image file is missing: ${variant.image?.filename || variant.image?.url || variant.image}` })
      }
    }
  }
  return NextResponse.json({ checkedProducts: result.docs.length, issues })
}
