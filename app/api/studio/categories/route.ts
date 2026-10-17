import config from '@payload-config'
import { getPayload } from 'payload'
import { defaultProductDimensionOptions, variantEditorOptions } from '@/lib/product-dimensions'

type DimensionValue = string | number
type Option = { value: DimensionValue; label: string; products?: { id: string | number; title: string; status: string }[] }
type Dimension = { key: string; label: string; valueType: 'text' | 'integer'; options: Option[] }
const builtIn: Dimension[] = [
  { key: 'lengths', label: 'Length', valueType: 'text', options: [...defaultProductDimensionOptions.lengths] },
  { key: 'shapes', label: 'Shape', valueType: 'text', options: [...defaultProductDimensionOptions.shapes] },
]

function responseError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

function normalizeOptions(value: unknown, fallback: Option[] = [], valueType: Dimension['valueType'] = 'text'): Option[] {
  if (!Array.isArray(value)) return fallback.map(({ value: optionValue, label }) => ({ value: optionValue, label }))
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const option = item as Record<string, unknown>
    const optionValue = valueType === 'integer' ? Number(option.value) : String(option.value || '').trim()
    if (valueType === 'integer' ? !Number.isSafeInteger(Number(optionValue)) || Number(optionValue) < 1 : !optionValue) return []
    return [{ value: optionValue, label: String(option.label || optionValue).trim() || String(optionValue) }]
  })
}

function normalizeCustomDimensions(value: unknown): Dimension[] {
  if (!Array.isArray(value)) return [{ key: 'quantity', label: 'Quantity', valueType: 'integer', options: [] }]
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const dimension = item as Record<string, unknown>
    const key = String(dimension.key || '').trim()
    const label = String(dimension.label || '').trim()
    if (!/^[a-z][a-z0-9-]*$/.test(key) || !label || builtIn.some((entry) => entry.key === key)) return []
    const valueType = dimension.valueType === 'integer' ? 'integer' : 'text'
    return [{ key, label, valueType, options: normalizeOptions(dimension.options, [], valueType) }]
  })
}

function humanize(value: string) {
  return value.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

async function getSnapshot(payload: Awaited<ReturnType<typeof getPayload>>, user: any) {
  const [stored, result] = await Promise.all([
    payload.findGlobal({ slug: 'product-dimensions', overrideAccess: false, user }).catch(() => null) as Promise<Record<string, any> | null>,
    // shortcut: scans up to 10,000 products, raise this if the catalog grows beyond that.
    payload.find({ collection: 'products', limit: 10000, pagination: false, depth: 0, overrideAccess: false, user }),
  ])
  const products = result.docs as Record<string, any>[]
  const dimensions = [
    { ...builtIn[0], options: normalizeOptions(stored?.lengths, builtIn[0].options) },
    { ...builtIn[1], options: normalizeOptions(stored?.shapes, builtIn[1].options) },
    ...normalizeCustomDimensions(stored?.dimensions),
  ]
  for (const dimension of dimensions) {
    if (dimension.valueType === 'integer') dimension.options = []
    const known = new Set(dimension.options.map(({ value }) => value))
    for (const product of products) {
      const variants = Array.isArray(product.variants) ? product.variants : []
      const values = dimension.key === 'lengths'
        ? [...variants.map((variant) => variant.length), ...String(product.length || '').split(',')]
        : dimension.key === 'shapes'
          ? [...variants.map((variant) => variant.shape), ...String(product.shape || '').split(',')]
          : variants.map((variant) => variant.attributes?.[dimension.key])
      for (const rawValue of values) {
        const value = dimension.valueType === 'integer' ? Number(rawValue) : String(rawValue || '').trim()
        if (dimension.valueType === 'integer' ? !Number.isSafeInteger(Number(value)) || Number(value) < 1 : !value) continue
        if (!known.has(value)) {
          dimension.options.push({ value, label: humanize(String(value)) })
          known.add(value)
        }
      }
    }
    dimension.options = dimension.options.map((option) => ({
      ...option,
      products: products.filter((product) => (product.variants || []).some((variant: any) => {
        const value = dimension.key === 'lengths' ? variant.length : dimension.key === 'shapes' ? variant.shape : variant.attributes?.[dimension.key]
        return String(value ?? '').trim() === String(option.value)
      }) || (dimension.key === 'lengths' || dimension.key === 'shapes') && String(product[dimension.key === 'lengths' ? 'length' : 'shape'] || '').split(',').map((value: string) => value.trim()).includes(String(option.value)))
        .map(({ id, title, status }) => ({ id, title, status })),
    }))
  }
  return { dimensions }
}

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return responseError('Authentication required.', 401)
  try {
    const snapshot = await getSnapshot(payload, user)
    if (new URL(request.url).searchParams.get('optionsOnly') === 'true') {
      return Response.json({
        options: Object.fromEntries(snapshot.dimensions.filter(({ key }) => key === 'lengths' || key === 'shapes').map(({ key, options }) => [key, options.map(({ value, label }) => ({ value, label }))])),
        dimensions: snapshot.dimensions.map(({ key, label, valueType, options }) => ({ key, label, valueType, options: variantEditorOptions(valueType, options.map(({ value, label }) => ({ value, label }))) })),
      })
    }
    return Response.json(snapshot)
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
    const action = String(body.action || '')
    const label = typeof body.label === 'string' ? body.label.trim() : ''
    const globalData = await payload.findGlobal({ slug: 'product-dimensions', overrideAccess: false, user }).catch(() => null) as Record<string, any> | null
    const customDimensions = normalizeCustomDimensions(globalData?.dimensions)
    if (action === 'create-dimension') {
      const key = label.toLocaleLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
      if (!key || !label) return responseError('Enter a dimension name using letters or numbers.', 400)
      if ([...builtIn, ...customDimensions].some((dimension) => dimension.key === key || dimension.label.toLowerCase() === label.toLowerCase())) return responseError('That dimension already exists.', 409)
      customDimensions.push({ key, label, valueType: body.valueType === 'integer' || key === 'quantity' ? 'integer' : 'text', options: [] })
      await payload.updateGlobal({ slug: 'product-dimensions', data: { dimensions: customDimensions } as never, overrideAccess: false, user })
      return Response.json(await getSnapshot(payload, user))
    }

    const dimensionKey = typeof body.dimension === 'string' ? body.dimension : ''
    const dimensions = [...builtIn, ...customDimensions]
    const dimension = dimensions.find((item) => item.key === dimensionKey)
    if (!dimension || !['add', 'rename', 'delete'].includes(action)) return responseError('Choose a dimension and a valid category action.', 400)
    if (dimension?.valueType === 'integer') return responseError('Enter integer values on each product variant instead of adding shared categories.', 400)
    const value: DimensionValue = typeof body.value === 'string' ? body.value.trim() : ''
    if (!value) return responseError('Enter a category value.', 400)
    const currentOptions = dimension.options.map(({ value, label }) => ({ value, label }))
    const selected = currentOptions.find((option) => String(option.value) === String(value))
    const products = (await getSnapshot(payload, user)).dimensions.find((item) => item.key === dimensionKey)?.options.find((item) => String(item.value) === String(value))?.products || []
    if (action === 'add') {
      if (!label) return responseError('Enter a display name.', 400)
      if (currentOptions.some((option) => String(option.value).toLocaleLowerCase() === String(value).toLocaleLowerCase())) return responseError('That category already exists.', 409)
      currentOptions.push({ value, label })
    } else if (action === 'rename') {
      if (!label) return responseError('Enter a display name.', 400)
      const index = currentOptions.findIndex((option) => String(option.value) === String(value))
      if (index < 0) return responseError('That category no longer exists.', 404)
      currentOptions[index] = { value, label }
    } else {
      if (products.length) return responseError(`This category is still used by ${products.length} product(s). Remove it from those variants first.`, 409)
      if (!selected) return responseError('That category no longer exists.', 404)
      const remaining = currentOptions.filter((option) => String(option.value) !== String(value))
      if (dimensionKey === 'lengths' || dimensionKey === 'shapes') await payload.updateGlobal({ slug: 'product-dimensions', data: { [dimensionKey]: remaining } as never, overrideAccess: false, user })
      else await payload.updateGlobal({ slug: 'product-dimensions', data: { dimensions: customDimensions.map((item) => item.key === dimensionKey ? { ...item, options: remaining } : item) } as never, overrideAccess: false, user })
      return Response.json(await getSnapshot(payload, user))
    }
    if (dimensionKey === 'lengths' || dimensionKey === 'shapes') await payload.updateGlobal({ slug: 'product-dimensions', data: { [dimensionKey]: currentOptions } as never, overrideAccess: false, user })
    else await payload.updateGlobal({ slug: 'product-dimensions', data: { dimensions: customDimensions.map((item) => item.key === dimensionKey ? { ...item, options: currentOptions } : item) } as never, overrideAccess: false, user })
    return Response.json(await getSnapshot(payload, user))
  } catch (error) {
    return responseError(error instanceof Error ? error.message : 'Could not update product categories.', 500)
  }
}
