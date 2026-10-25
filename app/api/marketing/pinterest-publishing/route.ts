import { isAdminUser } from '@/lib/admin-access'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!isAdminUser(user)) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  const [products, settings] = await Promise.all([
    payload.find({ collection: 'products', where: { status: { equals: 'published' } }, limit: 500, pagination: false, sort: 'title', depth: 1, overrideAccess: true }),
    payload.findGlobal({ slug: 'marketing-settings', depth: 0, overrideAccess: true }),
  ])
  return NextResponse.json({
    products: products.docs.map((product: any) => {
      const image = [product.featuredImage, ...(Array.isArray(product.gallery) ? product.gallery : [])].find((item: any) => item && typeof item === 'object' && item.url)
      return { id: String(product.id), title: product.title, sku: product.sku, imageURL: image?.url || '', imageTitle: image?.filename || '' }
    }),
    templates: {
      title: settings.pinterestTitleTemplate || '{productName} {length} {shape} Press-on Nails',
      description: settings.pinterestDescriptionTemplate || 'Shop {productName} press-on nails by {brand}. {length} length, {shape} shape.',
    },
  })
}

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!isAdminUser(user)) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  try {
    const body = await request.json()
    const productIDs: string[] = [...new Set<string>((Array.isArray(body.productIDs) ? body.productIDs : []).map((id: unknown) => String(id)))]
    const scheduledAt = new Date(body.scheduledAt)
    if (!productIDs.length) return NextResponse.json({ error: 'Select at least one product.' }, { status: 400 })
    if (productIDs.length > 100) return NextResponse.json({ error: 'Schedule no more than 100 products at once.' }, { status: 400 })
    if (Number.isNaN(scheduledAt.getTime())) return NextResponse.json({ error: 'Choose a valid publishing time.' }, { status: 400 })

    const titleTemplate = String(body.titleTemplate || '{productName} {length} {shape} Press-on Nails')
    const descriptionTemplate = String(body.descriptionTemplate || 'Shop {productName} press-on nails by {brand}. {length} length, {shape} shape.')
    await payload.updateGlobal({
      slug: 'marketing-settings',
      data: { pinterestTitleTemplate: titleTemplate, pinterestDescriptionTemplate: descriptionTemplate },
      overrideAccess: true,
    })

    const created: string[] = []
    const skipped: Array<{ title: string; reason: string }> = []
    for (const id of productIDs) {
      const product: any = await payload.findByID({ collection: 'products', id: String(id), depth: 1, overrideAccess: true }).catch(() => null)
      if (!product || product.status !== 'published') {
        skipped.push({ title: String(id), reason: 'Product is unavailable or not published.' })
        continue
      }
      const mainImage = [product.featuredImage, ...(Array.isArray(product.gallery) ? product.gallery : [])].find((item: any) => item && typeof item === 'object' && item.url)
      if (!mainImage?.url) {
        skipped.push({ title: product.title || id, reason: 'No product image is assigned.' })
        continue
      }
      const post = await payload.create({
        collection: 'pinterest-posts',
        data: {
          product: product.id,
          title: '',
          description: '',
          link: '',
          imageURL: '',
          scheduledAt: scheduledAt.toISOString(),
          status: 'scheduled',
        },
        overrideAccess: true,
      })
      created.push(String(post.id))
    }
    return NextResponse.json({ created: created.length, skipped, ids: created })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not schedule Pins.' }, { status: 500 })
  }
}
