import { describe, expect, it } from 'vitest'

import {
  parseUserListFilters,
  refineUsers,
  toUserListQueryVariables,
  userListPath,
  userPageLocalFields,
  userServerSearch,
  type UserListRow,
} from './userList'

function params(query: string) {
  return new URLSearchParams(query)
}

function user(
  partial: Partial<UserListRow> & Pick<UserListRow, 'id' | 'email'>,
): UserListRow {
  return {
    createdAt: '2026-09-18T12:00:00.000Z',
    disabled: false,
    profile: { name: 'Pat Lee' },
    worker: null,
    ...partial,
  }
}

describe('parseUserListFilters / userServerSearch', () => {
  it('prefers q for the server search, then email, then name', () => {
    const filters = parseUserListFilters(
      params('q=pat&email=pat@x.com&name=Lee&disabled=1&worker=0&from=2026-09-01'),
    )
    expect(filters.disabled).toBe('yes')
    expect(filters.worker).toBe('no')
    expect(userServerSearch(filters)).toBe('pat')
    expect(userServerSearch(parseUserListFilters(params('email=pat@x.com')))).toBe(
      'pat@x.com',
    )
  })
})

describe('toUserListQueryVariables', () => {
  it('maps the composed search onto adminUsers', () => {
    expect(
      toUserListQueryVariables(parseUserListFilters(params('email=pat@x.com'))),
    ).toEqual({ first: 25, search: 'pat@x.com' })
  })
})

describe('refineUsers', () => {
  const rows = [
    user({ id: '1', email: 'pat@x.com' }),
    user({
      id: '2',
      email: 'lee@x.com',
      disabled: true,
      profile: { name: 'Lee' },
      worker: { id: 'w1' },
      createdAt: '2026-08-01T00:00:00.000Z',
    }),
  ]

  it('filters disabled, worker, email, and created date on the current page', () => {
    expect(
      refineUsers(rows, parseUserListFilters(params('disabled=1'))).map(
        (row) => row.id,
      ),
    ).toEqual(['2'])
    expect(
      refineUsers(rows, parseUserListFilters(params('worker=1'))).map(
        (row) => row.id,
      ),
    ).toEqual(['2'])
    expect(
      refineUsers(rows, parseUserListFilters(params('email=pat'))).map(
        (row) => row.id,
      ),
    ).toEqual(['1'])
    expect(
      refineUsers(rows, parseUserListFilters(params('from=2026-09-01'))).map(
        (row) => row.id,
      ),
    ).toEqual(['1'])
  })
})

describe('userListPath', () => {
  it('uses /users and omits defaults', () => {
    expect(userListPath({})).toBe('/users')
    expect(userListPath({ q: 'pat', disabled: 'yes' })).toBe(
      '/users?q=pat&disabled=1',
    )
  })
})

describe('userPageLocalFields', () => {
  it('marks disabled, worker, and date as page-local', () => {
    expect(userPageLocalFields(parseUserListFilters(params('q=pat')))).toEqual(
      [],
    )
    expect(
      userPageLocalFields(parseUserListFilters(params('disabled=0&worker=1'))),
    ).toEqual(['Active / disabled', 'Worker flag'])
  })
})
