/** Session cookie — same name as SlashieApp/web so the JWT convention stays familiar. */
export const AUTH_COOKIE_NAME = 'auth'

function decodeCookieValue(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function readCookieValue(cookieName: string) {
  if (typeof document === 'undefined') return null
  const prefix = `${cookieName}=`
  const cookie = document.cookie
    .split(';')
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(prefix))
  if (!cookie) return null
  const decoded = decodeCookieValue(cookie.slice(prefix.length)).trim()
  return decoded.length > 0 ? decoded : null
}

export function setAuthToken(
  token: string,
  maxAgeSeconds: number = 60 * 60 * 24 * 7,
) {
  const safeToken = token.trim()
  if (!safeToken) return
  const encodedToken = encodeURIComponent(safeToken)
  document.cookie = `${AUTH_COOKIE_NAME}=${encodedToken}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`
}

export function clearAuthToken() {
  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`
}

export function getAuthToken() {
  return readCookieValue(AUTH_COOKIE_NAME)
}
