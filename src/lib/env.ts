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
