import config from '@payload-config'
import { getPayload } from 'payload'
import { defaultProductDimensionOptions, productUsesDimensionValue } from '@/lib/product-dimensions'

type Dimension = 'lengths' | 'shapes'
type Option = { value: string; label: string }

function responseError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

function normalizeOptions(value: unknown, fallback: readonly Option[]): Option[] {
  if (!Array.isArray(value)) return [...fallback]
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const option = item as Record<string, unknown>
    const optionValue = String(option.value || '').trim()
    if (!optionValue) return []
    return [{ value: optionValue, label: String(option.label || optionValue).trim() || optionValue }]
  })
}

function humanize(value: string) {
  return value.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

async function getSnapshot(payload: Awaited<ReturnType<typeof getPayload>>, user: any) {
  const [stored, result] = await Promise.all([
    payload.findGlobal({ slug: 'product-dimensions', overrideAccess: false, user }).catch(() => null),
    // shortcut: scans up to 10,000 products, raise this if the catalog grows beyond that.
    payload.find({ collection: 'products', limit: 10000, pagination: false, depth: 0, overrideAccess: false, user }),
  ])
  const products = result.docs as Record<string, any>[]
  const options = {
    lengths: normalizeOptions((stored as any)?.lengths, defaultProductDimensionOptions.lengths),
    shapes: normalizeOptions((stored as any)?.shapes, defaultProductDimensionOptions.shapes),
  }

  for (const dimension of ['lengths', 'shapes'] as const) {
    const field = dimension === 'lengths' ? 'length' : 'shape'
    const known = new Set(options[dimension].map(({ value }) => value))
    for (const product of products) {
      const variants = Array.isArray(product.variants) ? product.variants : []
      const values = [...variants.map((variant) => String(variant[field] || '').trim()), ...String(product[field] || '').split(',').map((item: string) => item.trim())]
      for (const value of values.filter(Boolean)) {
        if (known.has(value)) continue
        options[dimension].push({ value, label: humanize(value) })
        known.add(value)
      }
    }
  }

  return {
    options: Object.fromEntries((['lengths', 'shapes'] as const).map((dimension) => {
      const field = dimension === 'lengths' ? 'length' : 'shape'
      return [dimension, options[dimension].map((option) => ({
        ...option,
        products: products.filter((product) => productUsesDimensionValue(product, field, option.value)).map((product) => ({ id: product.id, title: product.title, status: product.status })),
      }))]
    })),
  }
}

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return responseError('Authentication required.', 401)

  try {
    if (new URL(request.url).searchParams.get('optionsOnly') === 'true') {
      const stored = await payload.findGlobal({ slug: 'product-dimensions', overrideAccess: false, user }).catch(() => null) as Record<string, unknown> | null
      return Response.json({
        options: {
          lengths: normalizeOptions(stored?.lengths, defaultProductDimensionOptions.lengths),
          shapes: normalizeOptions(stored?.shapes, defaultProductDimensionOptions.shapes),
        },
      })
    }
    return Response.json(await getSnapshot(payload, user))
  } catch (error) {
    return responseError(error instanceof Error ? error.message : 'Could not load product categories.', 500)
  }
}

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return responseError('Authentication required.', 401)

  try {
    const body = await request.json() as Record<string, unknown>
    const dimension = body.dimension === 'lengths' || body.dimension === 'shapes' ? body.dimension : null
    const action = body.action
    const value = typeof body.value === 'string' ? body.value.trim() : ''
    if (!dimension || !value || !['add', 'rename', 'delete'].includes(String(action))) return responseError('Choose a category and a valid action.', 400)

    const snapshot = await getSnapshot(payload, user)
    const options = snapshot.options[dimension].map(({ value, label }) => ({ value, label }))
    const selected = options.find((option) => option.value === value)
    const productCount = selected ? snapshot.options[dimension].find((option) => option.value === value)?.products.length || 0 : 0
    const globalData = await payload.findGlobal({ slug: 'product-dimensions', overrideAccess: false, user }).catch(() => null) as Record<string, unknown> | null
    const fallback = defaultProductDimensionOptions[dimension]
    const storedOptions = normalizeOptions(globalData?.[dimension], fallback)

    if (action === 'add') {
      const label = typeof body.label === 'string' ? body.label.trim() : ''
      const duplicate = options.some((option) => option.value.toLocaleLowerCase() === value.toLocaleLowerCase())
      if (duplicate) return responseError('That category already exists.', 409)
      if (!label) return responseError('Enter a display name.', 400)
      storedOptions.push({ value, label })
    } else if (action === 'rename') {
      const label = typeof body.label === 'string' ? body.label.trim() : ''
      if (!label) return responseError('Enter a display name.', 400)
      const index = storedOptions.findIndex((option) => option.value === value)
      if (index >= 0) storedOptions[index] = { value, label }
      else if (selected) storedOptions.push({ value, label })
      else return responseError('That category no longer exists.', 404)
    } else {
      if (productCount) return responseError(`This category is still used by ${productCount} product(s). Remove it from those product variants first.`, 409)
      const remaining = storedOptions.filter((option) => option.value !== value)
      if (remaining.length === storedOptions.length && !selected) return responseError('That category no longer exists.', 404)
      await payload.updateGlobal({ slug: 'product-dimensions', data: { [dimension]: remaining } as never, overrideAccess: false, user })
      return Response.json(await getSnapshot(payload, user))
    }

    await payload.updateGlobal({ slug: 'product-dimensions', data: { [dimension]: storedOptions } as never, overrideAccess: false, user })
    return Response.json(await getSnapshot(payload, user))
  } catch (error) {
    return responseError(error instanceof Error ? error.message : 'Could not update product categories.', 500)
  }
}
