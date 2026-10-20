import { open, stat } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import path from 'node:path'
import nextEnv from '@next/env'
import type { Payload } from 'payload'

const HEADER_BYTES = 4377
const TABLE_SUFFIXES = [
  'users', 'usermeta', 'wc_orders', 'wc_order_addresses', 'wc_orders_meta',
  'woocommerce_order_items', 'woocommerce_order_itemmeta', 'postmeta',
]

type Row = Record<string, string | null>
type ArchiveData = {
  customers: Row[]
  usermeta: Row[]
  orders: Row[]
  addresses: Row[]
  orderMeta: Row[]
  items: Row[]
  itemMeta: Row[]
  postMeta: Row[]
}

function tableSuffix(table: string) {
  return TABLE_SUFFIXES.find((suffix) => table === suffix || table.endsWith(`_${suffix}`))
}

function parseString(sql: string, start: number): [string, number] {
  let index = start + 1
  let value = ''
  const escapes: Record<string, string> = { '0': '\0', b: '\b', t: '\t', n: '\n', r: '\r', Z: '\x1a' }
  while (index < sql.length) {
    const char = sql[index]
    if (char === '\\' && index + 1 < sql.length) {
      const next = sql[index + 1]
      value += escapes[next] ?? next
      index += 2
      continue
    }
    if (char === "'") {
      if (sql[index + 1] === "'") {
        value += "'"
        index += 2
        continue
      }
      return [value, index + 1]
    }
    value += char
    index += 1
  }
  throw new Error('Unterminated MySQL string in the backup.')
}

function statementEnd(sql: string, start: number) {
  let quoted = false
  for (let index = start; index < sql.length; index += 1) {
    if (quoted) {
      if (sql[index] === '\\') index += 1
      else if (sql[index] === "'") {
        if (sql[index + 1] === "'") index += 1
        else quoted = false
      }
    } else if (sql[index] === "'") quoted = true
    else if (sql[index] === ';') return index
  }
  return sql.length
}

function parseRows(sql: string, start: number, end: number, columns: string[]): Row[] {
  const rows: Row[] = []
  let index = start
  while (index < end) {
    while (index < end && (sql[index] === ',' || /\s/.test(sql[index]))) index += 1
    if (index >= end) break
    if (sql[index] !== '(') throw new Error('Unexpected MySQL INSERT value in the backup.')
    index += 1
    const values: (string | null)[] = []
    while (index < end) {
      while (index < end && /\s/.test(sql[index])) index += 1
      if (sql[index] === ')') {
        index += 1
        break
      }
      if (sql[index] === "'") {
        const [value, nextIndex] = parseString(sql, index)
        values.push(value)
        index = nextIndex
      } else {
        const valueStart = index
        while (index < end && sql[index] !== ',' && sql[index] !== ')') index += 1
        const value = sql.slice(valueStart, index).trim()
        values.push(value.toUpperCase() === 'NULL' ? null : value)
      }
      while (index < end && /\s/.test(sql[index])) index += 1
      if (sql[index] === ',') index += 1
      else if (sql[index] === ')') {
        index += 1
        break
      } else throw new Error('Malformed MySQL INSERT row in the backup.')
    }
    if (values.length !== columns.length) throw new Error('MySQL INSERT column count does not match the backup schema.')
    rows.push(Object.fromEntries(columns.map((column, offset) => [column, values[offset]])))
  }
  return rows
}

async function readDatabaseSQL(archivePath: string) {
  const fileInfo = await stat(archivePath)
  const handle = await open(archivePath, 'r')
  try {
    let offset = 0
    while (offset + HEADER_BYTES <= fileInfo.size) {
      const header = Buffer.alloc(HEADER_BYTES)
      const { bytesRead } = await handle.read(header, 0, HEADER_BYTES, offset)
      if (bytesRead !== HEADER_BYTES) break
      const filename = header.subarray(0, 255).toString('utf8').split('\0')[0].trim()
      const lengthText = header.subarray(255, 269).toString('ascii').replaceAll('\0', '').trim()
      const length = Number(lengthText)
      if (!Number.isSafeInteger(length) || length < 0 || offset + HEADER_BYTES + length > fileInfo.size) {
        throw new Error(`Invalid archive entry at byte ${offset}.`)
      }
      if (path.posix.basename(filename) === 'database.sql') {
        const data = Buffer.allocUnsafe(length)
        const result = await handle.read(data, 0, length, offset + HEADER_BYTES)
        if (result.bytesRead !== length) throw new Error('The database.sql archive entry is incomplete.')
        return data.toString('utf8')
      }
      offset += HEADER_BYTES + length
    }
  } finally {
    await handle.close()
  }
  throw new Error('database.sql was not found in the WPress archive.')
}

async function parseArchive(archivePath: string): Promise<ArchiveData> {
  const sql = await readDatabaseSQL(archivePath)
  const definitions = new Map<string, string[]>()
  const createPattern = /CREATE TABLE `([^`]+)`\s*\(([\s\S]*?)\)\s*ENGINE/gi
  for (const match of sql.matchAll(createPattern)) {
    definitions.set(match[1], [...match[2].matchAll(/^\s*`([^`]+)`\s+/gm)].map((column) => column[1]))
  }

  const data: ArchiveData = { customers: [], usermeta: [], orders: [], addresses: [], orderMeta: [], items: [], itemMeta: [], postMeta: [] }
  const target = new Map<string, keyof ArchiveData>([
    ['users', 'customers'], ['usermeta', 'usermeta'], ['wc_orders', 'orders'],
    ['wc_order_addresses', 'addresses'], ['wc_orders_meta', 'orderMeta'],
    ['woocommerce_order_items', 'items'], ['woocommerce_order_itemmeta', 'itemMeta'], ['postmeta', 'postMeta'],
  ])
  const insertPattern = /INSERT INTO `([^`]+)`(?:\s*\(([^)]*)\))?\s*VALUES\s*/gi
  for (const match of sql.matchAll(insertPattern)) {
    const table = match[1]
    const suffix = tableSuffix(table)
    if (!suffix) continue
    const columns = match[2]
      ? match[2].split(',').map((column) => column.trim().replaceAll('`', ''))
      : definitions.get(table) || []
    if (!columns.length) throw new Error(`No column definition found for ${suffix}.`)
    const end = statementEnd(sql, match.index! + match[0].length)
    const rows = parseRows(sql, match.index! + match[0].length, end, columns)
    const destination = target.get(suffix)
    if (destination) data[destination].push(...rows)
  }
  return data
}

function groupMeta(rows: Row[], idField: string) {
  const grouped = new Map<string, Map<string, string>>()
  for (const row of rows) {
    const id = row[idField]
    const key = row.meta_key
    if (!id || !key || row.meta_value == null) continue
    if (!grouped.has(id)) grouped.set(id, new Map())
    grouped.get(id)!.set(key, row.meta_value)
  }
  return grouped
}

function value(row: Row, key: string) {
  return row[key] ?? ''
}

function amount(input: string | null | undefined) {
  const parsed = Number(input || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function customerAddress(meta: Map<string, string>, prefix: 'billing' | 'shipping') {
  const address = {
    address1: meta.get(`${prefix}_address_1`) || undefined,
    address2: meta.get(`${prefix}_address_2`) || undefined,
    city: meta.get(`${prefix}_city`) || undefined,
    state: meta.get(`${prefix}_state`) || undefined,
    postalCode: meta.get(`${prefix}_postcode`) || undefined,
    country: meta.get(`${prefix}_country`) || undefined,
    phone: prefix === 'billing' ? meta.get('billing_phone') || undefined : undefined,
  }
  return Object.values(address).some(Boolean) ? address : undefined
}

function orderAddress(row: Row | undefined) {
  if (!row) return undefined
  const fullName = [value(row, 'first_name'), value(row, 'last_name')].filter(Boolean).join(' ').trim()
  return {
    ...(fullName ? { fullName } : {}),
    ...(value(row, 'company') ? { company: value(row, 'company') } : {}),
    ...(value(row, 'phone') ? { phone: value(row, 'phone') } : {}),
    ...(value(row, 'address_1') ? { address1: value(row, 'address_1') } : {}),
    ...(value(row, 'address_2') ? { address2: value(row, 'address_2') } : {}),
    ...(value(row, 'city') ? { city: value(row, 'city') } : {}),
    ...(value(row, 'state') ? { state: value(row, 'state') } : {}),
    ...(value(row, 'postcode') ? { postalCode: value(row, 'postcode') } : {}),
    ...(value(row, 'country') ? { country: value(row, 'country') } : {}),
  }
}

function rolesFor(meta: Map<string, string> | undefined) {
  const capabilities = [...(meta?.entries() || [])].find(([key]) => key.toLowerCase().endsWith('capabilities'))?.[1] || ''
  return [...capabilities.matchAll(/s:\d+:"([^"]+)";b:1/g)].map((match) => match[1])
}

function wpDate(input: string | null | undefined) {
  if (!input || input.startsWith('0000-00-00')) return undefined
  const date = new Date(`${input.replace(' ', 'T')}Z`)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function supportedLegacyHash(hash: string) {
  const bcrypt = hash.startsWith('$wp$') ? hash.slice(3) : hash
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(bcrypt)
}

function trackingNumbers(input: string | undefined) {
  if (!input) return []
  const numbers = new Set<string>()
  try {
    const parsed = JSON.parse(input)
    const visit = (value: unknown) => {
      if (Array.isArray(value)) value.forEach(visit)
      else if (value && typeof value === 'object') {
        for (const [key, item] of Object.entries(value)) {
          if (/^tracking_?number$/i.test(key) && typeof item === 'string' && item.trim()) numbers.add(item.trim())
          else visit(item)
        }
      }
    }
    visit(parsed)
  } catch {
    for (const match of input.matchAll(/s:\d+:"tracking_number";s:\d+:"([^";]+)"/gi)) numbers.add(match[1])
  }
  return [...numbers]
}

function itemVariant(meta: Map<string, string> | undefined) {
  if (!meta) return undefined
  const parts = [...meta.entries()]
    .filter(([key, entry]) => key.startsWith('pa_') && entry)
    .map(([key, entry]) => `${key.slice(3).replaceAll('-', ' ').replaceAll('_', ' ')}: ${entry}`)
  return parts.length ? parts.join(' · ') : undefined
}

function buildOrder(row: Row, data: ArchiveData, customersByWpID: Map<string, number | string>, skuByPost: Map<string, string>) {
  const orderID = value(row, 'id')
  const itemMeta = groupMeta(data.itemMeta, 'order_item_id')
  const orderMeta = groupMeta(data.orderMeta, 'order_id').get(orderID)
  const orderAddresses = new Map(data.addresses.filter((address) => value(address, 'order_id') === orderID).map((address) => [value(address, 'address_type'), address]))
  const orderItems = data.items.filter((item) => value(item, 'order_id') === orderID)
  const lineItems = orderItems.filter((item) => value(item, 'order_item_type') === 'line_item')
  const importedItems = lineItems.map((item) => {
    const itemID = value(item, 'order_item_id')
    const meta = itemMeta.get(itemID)
    const productID = meta?.get('_product_id') || ''
    const variationID = meta?.get('_variation_id') || ''
    const quantity = Math.max(1, Math.floor(amount(meta?.get('_qty')) || 1))
    const lineSubtotal = amount(meta?.get('_line_subtotal'))
    const lineTotal = amount(meta?.get('_line_total'))
    const sku = (variationID && skuByPost.get(variationID)) || (productID && skuByPost.get(productID))
    const variant = itemVariant(meta)
    return {
      ...(sku ? { sku } : {}),
      ...(variant ? { variant } : {}),
      ...(variationID && variationID !== '0' ? { variantId: variationID } : {}),
      ...(productID ? { legacyProductID: productID } : {}),
      title: value(item, 'order_item_name') || 'WooCommerce product',
      quantity,
      unitPrice: Number((lineTotal / quantity).toFixed(2)),
      lineSubtotal: Number(lineSubtotal.toFixed(2)),
      lineTotal: Number(lineTotal.toFixed(2)),
    }
  })
  const subtotal = importedItems.reduce((sum, item) => sum + item.lineSubtotal, 0)
  const itemTotals = importedItems.reduce((sum, item) => sum + item.lineTotal, 0)
  const couponDiscount = orderItems.filter((item) => value(item, 'order_item_type') === 'coupon')
    .reduce((sum, item) => sum + amount(itemMeta.get(value(item, 'order_item_id'))?.get('discount_amount')), 0)
  const shippingTotal = orderItems.filter((item) => value(item, 'order_item_type') === 'shipping')
    .reduce((sum, item) => sum + amount(itemMeta.get(value(item, 'order_item_id'))?.get('cost')), 0)
  const date = wpDate(value(row, 'date_created_gmt'))
  const address = orderAddress(orderAddresses.get('shipping'))
  const billing = orderAddress(orderAddresses.get('billing'))
  const customerId = customersByWpID.get(value(row, 'customer_id'))
  const paymentMethod = value(row, 'payment_method')
  const methodLower = paymentMethod.toLowerCase()
  const paymentProvider = methodLower.includes('paypal') || methodLower.includes('ppcp') ? 'paypal'
    : methodLower.includes('stripe') ? 'stripe' : undefined
  const status = value(row, 'status').replace(/^wc-/, '')
  const paymentStatus = status === 'completed' || status === 'processing' ? 'paid'
    : status === 'cancelled' ? 'cancelled' : status === 'refunded' ? 'refunded'
      : status === 'failed' ? 'failed' : 'pending'
  const fulfillmentStatus = status === 'completed' ? 'delivered'
    : status === 'cancelled' ? 'cancelled' : status === 'processing' ? 'processing' : 'unfulfilled'
  const tracking = trackingNumbers(orderMeta?.get('_wc_shipment_tracking_items'))
  const promoCode = orderItems.filter((item) => value(item, 'order_item_type') === 'coupon').map((item) => value(item, 'order_item_name')).filter(Boolean).join(', ')
  const total = amount(row.total_amount)
  const taxTotal = amount(row.tax_amount)
  const legacyNumber = orderMeta?.get('_order_number') || orderID
  const dataToCreate = {
    orderNumber: legacyNumber,
    legacyWooCommerceID: orderID,
    ...(date ? { createdAt: date, legacyWooCommerceDate: date } : {}),
    ...(customerId ? { customer: customerId } : {}),
    customerEmail: (value(row, 'billing_email') || '').trim().toLowerCase(),
    currency: value(row, 'currency') || 'USD',
    ...(paymentProvider ? { paymentProvider } : {}),
    ...(paymentMethod ? { legacyPaymentMethod: paymentMethod } : {}),
    ...(value(row, 'payment_method_title') ? { legacyPaymentMethodTitle: value(row, 'payment_method_title') } : {}),
    ...(value(row, 'transaction_id') ? { paymentReference: value(row, 'transaction_id') } : {}),
    items: importedItems,
    shippingAddress: address,
    ...(billing ? { billingAddress: billing } : {}),
    subtotal: Number(subtotal.toFixed(2)),
    shippingTotal: Number(shippingTotal.toFixed(2)),
    taxTotal: Number(taxTotal.toFixed(2)),
    discountTotal: Number(Math.max(subtotal - itemTotals, couponDiscount).toFixed(2)),
    total: Number(total.toFixed(2)),
    ...(promoCode ? { promoCode } : {}),
    paymentStatus,
    fulfillmentStatus,
    ...(tracking.length ? { trackingNumber: tracking.join(', ') } : {}),
    ...(value(row, 'customer_note') ? { customerNote: value(row, 'customer_note') } : {}),
  }
  return {
    id: orderID,
    sourceStatus: status,
    date,
    total,
    itemCount: importedItems.length,
    currency: value(row, 'currency') || 'USD',
    missingEmail: !dataToCreate.customerEmail,
    missingShippingAddress: !address?.address1 || !address.city || !address.postalCode || !address.country,
    reconciled: Math.abs(subtotal + shippingTotal + taxTotal - dataToCreate.discountTotal - total) < 0.02,
    data: dataToCreate,
  }
}

async function findOne(payload: Payload, collection: 'customers' | 'orders', field: string, equals: string) {
  const result = await payload.find({ collection, where: { [field]: { equals } }, limit: 1, depth: 0, overrideAccess: true, showHiddenFields: collection === 'customers' })
  return result.docs[0] as (typeof result.docs)[number] | undefined
}

async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const sourceOnly = args.includes('--source-only')
  const sourcePath = args.find((arg) => !arg.startsWith('--'))
  if (!sourcePath) throw new Error('Usage: npm run migrate:woocommerce-data -- [--source-only | --apply] /path/to/backup.wpress')

  const archive = await parseArchive(sourcePath)
  const userMeta = groupMeta(archive.usermeta, 'user_id')
  const customerSource = archive.customers.filter((user) => {
    const roles = rolesFor(userMeta.get(value(user, 'ID')))
    return roles.includes('customer') && !roles.includes('administrator')
  })
  const orders = archive.orders.filter((row) => value(row, 'type') === 'shop_order')
  const skuByPost = new Map(archive.postMeta.filter((row) => value(row, 'meta_key') === '_sku').map((row) => [value(row, 'post_id'), value(row, 'meta_value')]))
  const sourceOnlyOrders = orders.map((row) => buildOrder(row, archive, new Map(), skuByPost))
  if (sourceOnly) {
    const statusCounts = Object.fromEntries([...new Set(sourceOnlyOrders.map(({ sourceStatus }) => sourceStatus))]
      .map((status) => [status, sourceOnlyOrders.filter((order) => order.sourceStatus === status).length]))
    console.log(JSON.stringify({
      source: path.basename(sourcePath),
      sourceCustomerAccounts: customerSource.length,
      unsupportedPasswordHashes: customerSource.filter((user) => !supportedLegacyHash(value(user, 'user_pass'))).length,
      sourceOrders: sourceOnlyOrders.length,
      statusCounts,
      lineItems: sourceOnlyOrders.reduce((sum, order) => sum + order.itemCount, 0),
      totalUSD: Number(sourceOnlyOrders.reduce((sum, order) => sum + order.total, 0).toFixed(2)),
      missingBillingEmail: sourceOnlyOrders.filter((order) => order.missingEmail).length,
      incompleteShippingAddress: sourceOnlyOrders.filter((order) => order.missingShippingAddress).length,
      amountReconciliationIssues: sourceOnlyOrders.filter((order) => !order.reconciled).length,
      mode: 'source-only dry-run; no database connection or writes',
    }, null, 2))
    return
  }

  process.env.NODE_ENV = 'production'
  process.env.VERCEL_ENV = 'production'
  nextEnv.loadEnvConfig(process.cwd(), false)
  const { default: config } = await import('../payload.config.ts')
  const { getPayload } = await import('payload')
  const payload = await getPayload({ config })
  try {
    const customersByWpID = new Map<string, number | string>()
    let newCustomers = 0
    let existingCustomers = 0
    let conflictingCustomers = 0
    let unsupportedHashes = 0
    const customerRecords = customerSource.map((user) => {
      const meta = userMeta.get(value(user, 'ID')) || new Map<string, string>()
      const email = value(user, 'user_email').trim().toLowerCase()
      const firstName = meta.get('first_name') || meta.get('billing_first_name') || ''
      const lastName = meta.get('last_name') || meta.get('billing_last_name') || ''
      const fullName = value(user, 'display_name') || [firstName, lastName].filter(Boolean).join(' ')
      const hash = value(user, 'user_pass')
      const billingAddress = customerAddress(meta, 'billing')
      const shippingAddress = customerAddress(meta, 'shipping')
      return {
        wpID: value(user, 'ID'), email, fullName, hash,
        data: {
          email, fullName, legacyWordpressID: value(user, 'ID'), legacyPasswordHash: hash,
          password: randomBytes(32).toString('base64url'),
          ...(billingAddress ? { billingAddress } : {}),
          ...(shippingAddress ? { shippingAddress } : {}),
        },
      }
    })

    const customerPlans: { record: (typeof customerRecords)[number]; existingID?: number | string; conflict?: boolean }[] = []
    for (const customer of customerRecords) {
      if (!/^\S+@\S+\.\S+$/.test(customer.email)) {
        conflictingCustomers += 1
        continue
      }
      const supported = supportedLegacyHash(customer.hash)
      if (!supported) unsupportedHashes += 1
      const existingByID = await findOne(payload, 'customers', 'legacyWordpressID', customer.wpID)
      if (existingByID) {
        const id = existingByID.id as number | string
        customersByWpID.set(customer.wpID, id)
        existingCustomers += 1
        customerPlans.push({ record: customer, existingID: id })
        continue
      }
      const existingByEmail = await findOne(payload, 'customers', 'email', customer.email)
      if (existingByEmail) {
        conflictingCustomers += 1
        customerPlans.push({ record: customer, conflict: true })
        continue
      }
      newCustomers += 1
      customerPlans.push({ record: customer })
    }

    const builtOrders = orders.map((row) => buildOrder(row, archive, customersByWpID, skuByPost))
    let newOrders = 0
    let existingOrders = 0
    let conflictingOrders = 0
    for (const order of builtOrders) {
      const existing = await findOne(payload, 'orders', 'legacyWooCommerceID', order.id)
      if (existing) {
        existingOrders += 1
        continue
      }
      const number = String(order.data.orderNumber)
      if (await findOne(payload, 'orders', 'orderNumber', number)) conflictingOrders += 1
      else newOrders += 1
    }

    const statusCounts = Object.fromEntries([...new Set(builtOrders.map(({ sourceStatus }) => sourceStatus))]
      .map((status) => [status, builtOrders.filter((order) => order.sourceStatus === status).length]))
    const summary = {
      target: 'current .env.local database',
      source: path.basename(sourcePath),
      customers: { sourceCustomerAccounts: customerSource.length, plannedNew: newCustomers, alreadyImported: existingCustomers, conflicts: conflictingCustomers, unsupportedPasswordHashes: unsupportedHashes },
      orders: { sourceOrders: orders.length, statusCounts, plannedNew: newOrders, alreadyImported: existingOrders, orderNumberConflicts: conflictingOrders, lineItems: builtOrders.reduce((sum, order) => sum + order.itemCount, 0), totalUSD: Number(builtOrders.reduce((sum, order) => sum + order.total, 0).toFixed(2)), missingBillingEmail: builtOrders.filter((order) => order.missingEmail).length, incompleteShippingAddress: builtOrders.filter((order) => order.missingShippingAddress).length, amountReconciliationIssues: builtOrders.filter((order) => !order.reconciled).length },
      mode: apply ? 'apply' : 'dry-run',
    }
    console.log(JSON.stringify(summary, null, 2))

    if (!apply) return
    if (process.env.VERCEL_ENV !== 'production') throw new Error('Apply mode requires the explicitly selected Production environment.')
    if (conflictingCustomers || conflictingOrders || unsupportedHashes || builtOrders.some((order) => order.missingEmail || order.missingShippingAddress || !order.reconciled)) {
      throw new Error('Preflight found conflicts or incomplete source records; no records were written.')
    }

    for (const plan of customerPlans) {
      if (plan.conflict || plan.existingID) continue
      const created = await payload.create({ collection: 'customers', data: plan.record.data, overrideAccess: true, showHiddenFields: true, disableVerificationEmail: true })
      customersByWpID.set(plan.record.wpID, created.id as number | string)
    }
    for (const order of builtOrders) {
      if (await findOne(payload, 'orders', 'legacyWooCommerceID', order.id)) continue
      const duplicateNumber = await findOne(payload, 'orders', 'orderNumber', String(order.data.orderNumber))
      if (duplicateNumber) throw new Error(`Order number conflict for source order ${order.id}; import stopped.`)
      const data = {
        ...order.data,
        ...(customersByWpID.get(value(archive.orders.find((row) => value(row, 'id') === order.id) || {}, 'customer_id'))
          ? { customer: customersByWpID.get(value(archive.orders.find((row) => value(row, 'id') === order.id) || {}, 'customer_id')) }
          : {}),
      }
      await payload.create({ collection: 'orders', data, overrideAccess: true })
    }
    console.log('Import complete. Re-run the command to verify it reports all source rows as already imported.')
  } finally {
    await payload.destroy()
  }
}

main().catch((error) => {
  console.error(`WooCommerce migration failed: ${error instanceof Error ? error.message : 'unknown error'}`)
  process.exitCode = 1
})
