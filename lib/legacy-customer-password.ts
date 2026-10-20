import { createHmac } from 'node:crypto'
import { compare } from 'bcryptjs'
import type { CollectionBeforeOperationHook } from 'payload'

export async function verifyWordPressPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || Buffer.byteLength(password) > 4096) return false
  const wordpress = storedHash.startsWith('$wp$')
  const hash = wordpress ? storedHash.slice(3) : storedHash
  const match = /^\$2[aby]\$(\d{2})\$[./A-Za-z0-9]{53}$/.exec(hash)
  // Bound work for malformed imports; this backup uses WordPress bcrypt at cost 12.
  if (!match || Number(match[1]) < 4 || Number(match[1]) > 14) return false
  const candidate = wordpress ? createHmac('sha384', 'wp-sha384').update(password).digest('base64') : password
  return compare(candidate, hash)
}

export const upgradeLegacyCustomerPassword: CollectionBeforeOperationHook = async ({ args, operation, req }) => {
  if (operation !== 'login') return args
  const data = 'data' in args ? args.data : null
  if (!data || typeof data.email !== 'string' || typeof data.password !== 'string' || data.email.length > 254 || Buffer.byteLength(data.password) > 4096) return args
  const { docs } = await req.payload.find({
    collection: 'customers',
    where: { email: { equals: data.email.trim().toLowerCase() } },
    limit: 1,
    depth: 0,
    showHiddenFields: true,
    overrideAccess: true,
  })
  const customer = docs[0]
  if (!customer?.legacyPasswordHash || (customer.lockUntil && new Date(customer.lockUntil).getTime() > Date.now())) return args
  if (await verifyWordPressPassword(data.password, customer.legacyPasswordHash)) {
    await req.payload.update({
      collection: 'customers',
      id: customer.id,
      data: { password: data.password },
      context: { verifiedLegacyHash: customer.legacyPasswordHash },
      overrideAccess: true,
    })
  }
  // Failed legacy checks continue through Payload's normal attempt counter and lockout.
  return args
}
