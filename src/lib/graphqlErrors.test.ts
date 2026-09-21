import { describe, expect, it } from 'vitest'

import {
  graphqlErrorMessage,
  isMissingAdminFieldError,
  isUnknownFilterFieldError,
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
    expect(
      isMissingAdminFieldError(
        new Error('Cannot query field "adminFeedbacks" on type "Query".'),
      ),
    ).toBe(true)
    expect(
      isMissingAdminFieldError(new Error('Not an admin')),
    ).toBe(false)
  })
})

describe('isUnknownFilterFieldError', () => {
  it('detects BE-49 bbox / AdminTaskFilter fields without treating missing adminTasks as the same', () => {
    expect(
      isUnknownFilterFieldError(
        new Error('Field "bbox" is not defined by type "AdminTaskFilter".'),
      ),
    ).toBe(true)
    expect(
      isUnknownFilterFieldError(
        new Error('Unknown argument "bbox" on field "Query.adminTasks".'),
      ),
    ).toBe(true)
    expect(
      isUnknownFilterFieldError(
        new Error('Cannot query field "adminTasks" on type "Query".'),
      ),
    ).toBe(false)
  })
})

describe('graphqlErrorMessage', () => {
  it('falls back when the error is not GraphQL-shaped', () => {
    expect(graphqlErrorMessage(new Error('nope'))).toBe('nope')
    expect(graphqlErrorMessage('x')).toBe('Something went wrong')
  })
})
