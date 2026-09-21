export function graphqlOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_GRAPHQL_URL?.trim()
  return (raw && raw.length > 0 ? raw : 'https://api.slashie.app').replace(
    /\/$/,
    '',
  )
}

export function graphqlHttpUri(): string {
  return `${graphqlOrigin()}/graphql`
}

export function googleClientId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? ''
}

export function isGoogleAuthConfigured(): boolean {
  return googleClientId().length > 0
}

/** Public marketplace origin (live task pages). */
export function publicAppOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()
  return (raw && raw.length > 0 ? raw : 'https://slashie.app').replace(
    /\/$/,
    '',
  )
}

export function publicTaskUrl(taskId: string): string {
  const id = taskId.trim()
  if (!id) return publicAppOrigin()
  return `${publicAppOrigin()}/tasks/${encodeURIComponent(id)}`
}

export function mapboxAccessToken(): string {
  return process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? ''
}

export function mapboxStyleUrl(): string {
  const raw = process.env.NEXT_PUBLIC_MAPBOX_STYLE_LIGHT?.trim()
  return raw && raw.length > 0
    ? raw
    : 'mapbox://styles/mapbox/light-v11'
}
