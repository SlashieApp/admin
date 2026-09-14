import 'server-only'

import { cookies } from 'next/headers'

import { AUTH_COOKIE_NAME } from '@/lib/authCookie'

export async function getServerAuthToken(): Promise<string | null> {
  const store = await cookies()
  const raw = store.get(AUTH_COOKIE_NAME)?.value
  if (!raw) return null
  try {
    const decoded = decodeURIComponent(raw).trim()
    return decoded.length > 0 ? decoded : null
  } catch {
    const trimmed = raw.trim()
    return trimmed.length > 0 ? trimmed : null
  }
}
