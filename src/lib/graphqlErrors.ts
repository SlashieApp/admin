import { CombinedGraphQLErrors } from '@apollo/client/errors'

export function graphqlErrorMessage(error: unknown): string {
  if (CombinedGraphQLErrors.is(error)) {
    const first = error.errors[0]?.message?.trim()
    if (first) return first
  }
  if (error instanceof Error && error.message.trim()) return error.message
  return 'Something went wrong'
}

export function isMissingAdminFieldError(error: unknown): boolean {
  const message = graphqlErrorMessage(error).toLowerCase()
  return (
    message.includes('cannot query field') ||
    message.includes('unknown field') ||
    message.includes('unknown argument') ||
    (message.includes('admin') &&
      (message.includes('undefined') || message.includes('not found')))
  )
}

export function isForbiddenAdminError(error: unknown): boolean {
  const message = graphqlErrorMessage(error).toLowerCase()
  return (
    message.includes('not an admin') ||
    message.includes('not admin') ||
    message.includes('forbidden') ||
    message.includes('unauthorized')
  )
}
