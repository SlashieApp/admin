export const ADMIN_EMAIL_DOMAIN = 'slashie.app'
export const PRIMARY_ADMIN_EMAIL = 'admin@slashie.app'

export function isSlashieAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.trim().toLowerCase().endsWith(`@${ADMIN_EMAIL_DOMAIN}`)
}

/** Decode a Google ID token payload enough to read `email` (unverified). */
export function emailFromGoogleIdToken(idToken: string): string | null {
  const parts = idToken.split('.')
  if (parts.length < 2) return null
  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    const json = JSON.parse(globalThis.atob(padded)) as { email?: unknown }
    return typeof json.email === 'string' ? json.email : null
  } catch {
    return null
  }
}

export function looksLikeId(value: string): boolean {
  const q = value.trim()
  return /^[a-f0-9]{24}$/i.test(q) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q)
}
