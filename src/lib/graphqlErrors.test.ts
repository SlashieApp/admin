import { describe, expect, it } from 'vitest'

import {
  graphqlErrorMessage,
} from './graphqlErrors'

describe('graphqlErrorMessage', () => {
  it('falls back when the error is not GraphQL-shaped', () => {
    expect(graphqlErrorMessage(new Error('nope'))).toBe('nope')
    expect(graphqlErrorMessage('x')).toBe('Something went wrong')
  })
})
