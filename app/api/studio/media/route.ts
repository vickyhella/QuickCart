import { isAdminUser } from '@/lib/admin-access'
import config from '@payload-config'
import { getPayload } from 'payload'

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!isAdminUser(user)) return Response.json({ error: 'Authentication required.' }, { status: 401 })
  const params = new URL(request.url).searchParams
  const page = Math.max(1, Number(params.get('page')) || 1)
  const search = params.get('search')?.trim()
  const where: any = { and: [{ mimeType: { equals: 'image/webp' } }] }
  if (search) where.and.push({ or: [{ filename: { like: search } }, { title: { like: search } }] })
  const result = await payload.find({ collection: 'media', where, page, limit: 24, sort: '-createdAt', depth: 0, overrideAccess: false, user })
  return Response.json({ docs: result.docs.map(({ id, url, filename, title }) => ({ id, url, filename, title })), page: result.page, totalPages: result.totalPages })
}
