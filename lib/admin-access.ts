import type { Access, SanitizedConfig } from 'payload'

export function isAdminUser(user: { collection?: string } | null | undefined): boolean {
  return user?.collection === 'users'
}

export function restrictDocumentLocksToAdmins(config: SanitizedConfig): SanitizedConfig {
  const locks = config.collections.find(({ slug }) => slug === 'payload-locked-documents')
  if (locks) {
    const adminOnly: Access = ({ req }) => isAdminUser(req.user)
    locks.access = { ...locks.access, create: adminOnly, read: adminOnly, update: adminOnly, delete: adminOnly }
  }
  return config
}
