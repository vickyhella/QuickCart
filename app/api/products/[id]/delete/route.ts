import { isAdminUser } from '@/lib/admin-access'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { deleteProduct } from '@/lib/delete-product'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!isAdminUser(user))
    return NextResponse.json(
      { error: 'Authentication required.' },
      { status: 401 },
    )

  const { id } = await context.params
  try {
    const force = new URL(request.url).searchParams.get('force') === 'true'
    const result = await deleteProduct(payload, id, force)
    if ('requiresForce' in result)
      return NextResponse.json(
        { ...result, error: 'This product is referenced by other records.' },
        { status: 409 },
      )
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not delete this product.',
      },
      { status: 500 },
    )
  }
}
