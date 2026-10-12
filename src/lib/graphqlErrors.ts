import { CombinedGraphQLErrors } from '@apollo/client/errors'

export function graphqlErrorMessage(error: unknown): string {
  if (CombinedGraphQLErrors.is(error)) {
    const first = error.errors[0]?.message?.trim()
    if (first) return first
  }
  if (error instanceof Error && error.message.trim()) return error.message
  return 'Something went wrong'
}
