import config from '@payload-config'
import { getPayload } from 'payload'

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ error: 'Authentication required.' }, { status: 401 })

  try {
    const result = await payload.find({
      collection: 'suppliers',
      limit: 1000,
      pagination: false,
      sort: 'name',
      depth: 0,
      overrideAccess: false,
      user,
    })
    return Response.json({ docs: result.docs.map(({ id, name }) => ({ id, name })) })
  } catch (cause) {
    return Response.json({ error: cause instanceof Error ? cause.message : 'Could not load suppliers.' }, { status: 500 })
  }
}
