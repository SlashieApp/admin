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

export function mapboxAccessToken(): string {
  return process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? ''
}

export function mapboxStyleUrl(): string {
  const custom = process.env.NEXT_PUBLIC_MAPBOX_STYLE_LIGHT?.trim()
  return custom && custom.length > 0
    ? custom
    : 'mapbox://styles/mapbox/streets-v12'
}
