import config from '@payload-config'
import { getPayload } from 'payload'

const relationID = (value: unknown) => String(value && typeof value === 'object' && 'id' in value ? value.id : value ?? '')
const errorResponse = (message: string, status = 400) => Response.json({ error: message }, { status })

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return errorResponse('Authentication required.', 401)

  try {
    const { id } = await context.params
    const supplier = await payload.findByID({ collection: 'suppliers', id, depth: 0, overrideAccess: false, user })
    const params = new URL(request.url).searchParams
    const query = params.get('search')?.trim() || ''
    const page = Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1)
    const assigned = params.get('assigned') !== 'false'
    const filters = [
      { suppliers: { [assigned ? 'equals' : 'not_equals']: id } },
      ...(query ? [{ or: [{ title: { contains: query } }, { chineseName: { contains: query } }] }] : []),
    ]
    const result = await payload.find({
      collection: 'products', where: { and: filters }, page, limit: 50, sort: 'title', depth: 0,
      select: { title: true, chineseName: true, status: true, purchaseURL: true, suppliers: true },
      overrideAccess: false, user,
    })
    return Response.json({
      supplier: { id: String(supplier.id), name: supplier.name },
      docs: result.docs.map((product: any) => ({
        id: String(product.id), title: product.title || '', chineseName: product.chineseName || '', status: product.status || 'draft', purchaseURL: product.purchaseURL || '',
        assigned: (product.suppliers || []).some((related: unknown) => relationID(related) === id),
      })),
      page: result.page || page,
      totalPages: result.totalPages,
      totalDocs: result.totalDocs,
    })
  } catch (cause) {
    return errorResponse(cause instanceof Error ? cause.message : 'Could not load supplier products.', 500)
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return errorResponse('Authentication required.', 401)

  let body: any
  try { body = await request.json() } catch { return errorResponse('Invalid request body.') }
  const action = body.action === 'bind' || body.action === 'unbind' || body.action === 'status' ? body.action : null
  const status = body.status === 'draft' || body.status === 'published' ? body.status : null
  const ids = Array.isArray(body.productIDs) ? [...new Set<string>(body.productIDs.map((id: unknown) => String(id ?? '').trim()).filter(Boolean))] : []
  if (!action) return errorResponse('Choose a valid bulk action.')
  if (action === 'status' && !status) return errorResponse('Choose Draft or Published status.')
  if (!ids.length || ids.length > 100) return errorResponse('Select between 1 and 100 products.')

  try {
    const { id: supplierID } = await context.params
    await payload.findByID({ collection: 'suppliers', id: supplierID, depth: 0, overrideAccess: false, user })
    const updated: string[] = []
    const failed: { id: string; title: string; error: string }[] = []
    for (const id of ids) {
      let product: any
      try {
        product = await payload.findByID({ collection: 'products', id, depth: 0, overrideAccess: false, user })
        const existing = (product.suppliers || []).map(relationID).filter(Boolean)
        if (action === 'status') {
          if (!existing.includes(supplierID)) throw new Error('This product is not linked to this supplier.')
          if (product.status !== status) await payload.update({ collection: 'products', id: product.id, data: { status }, depth: 0, overrideAccess: false, user })
        } else {
          const next: string[] = action === 'bind'
            ? [...new Set([...existing, supplierID])]
            : existing.filter((current: string) => current !== supplierID)
          if (next.length !== existing.length || next.some((current, index) => current !== existing[index])) {
            await payload.update({ collection: 'products', id: product.id, data: { suppliers: next.map(Number) }, depth: 0, overrideAccess: false, user })
          }
        }
        updated.push(String(product.id))
      } catch (cause) {
        failed.push({ id, title: product?.title || id, error: cause instanceof Error ? cause.message : 'Could not update this product.' })
      }
    }
    return Response.json({ updated, failed })
  } catch (cause) {
    return errorResponse(cause instanceof Error ? cause.message : 'Could not update supplier products.', 500)
  }
}
