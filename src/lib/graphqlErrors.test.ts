import { describe, expect, it } from 'vitest'

import {
  graphqlErrorMessage,
  isMissingAdminFieldError,
} from './graphqlErrors'

describe('isMissingAdminFieldError', () => {
  it('detects missing BE-43 fields so the UI can show a banner', () => {
    expect(
      isMissingAdminFieldError(
        new Error('Cannot query field "adminUsers" on type "Query".'),
      ),
    ).toBe(true)
    expect(
      isMissingAdminFieldError(
        new Error('Unknown argument "filter" on field "Query.adminTasks".'),
      ),
    ).toBe(true)
    expect(
      isMissingAdminFieldError(
        new Error('Cannot query field "adminReports" on type "Query".'),
      ),
    ).toBe(true)
  })
})

describe('graphqlErrorMessage', () => {
  it('falls back when the error is not GraphQL-shaped', () => {
    expect(graphqlErrorMessage(new Error('nope'))).toBe('nope')
    expect(graphqlErrorMessage('x')).toBe('Something went wrong')
  })
})
