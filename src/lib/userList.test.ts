import { describe, expect, it } from 'vitest'

import {
  parseUserListFilters,
  sortUsers,
  toUserListQueryVariables,
  userListPath,
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

describe('toUserListQueryVariables', () => {
  it('sends search, disabled, worker, created bounds, and cursor to adminUsers', () => {
    expect(
      toUserListQueryVariables(
        parseUserListFilters(
          params('q=pat&disabled=1&worker=0&from=2026-09-01&to=2026-09-30&after=u9'),
        ),
      ),
    ).toEqual({
      first: 25,
      search: 'pat',
      disabled: true,
      isWorker: false,
      createdAfter: '2026-09-01T00:00:00.000Z',
      createdBefore: '2026-09-30T23:59:59.999Z',
      after: 'u9',
    })
  })

  it('sends only page size with no filters', () => {
    expect(toUserListQueryVariables(parseUserListFilters(params('')))).toEqual({
      first: 25,
    })
  })
})

describe('sortUsers', () => {
  it('sorts the fetched page', () => {
    const rows = [
      user({ id: '1', email: 'pat@x.com' }),
      user({ id: '2', email: 'lee@x.com', profile: { name: 'Lee' } }),
    ]
    expect(
      sortUsers(rows, parseUserListFilters(params('sort=name&dir=asc'))).map(
        (row) => row.id,
      ),
    ).toEqual(['2', '1'])
  })
})

describe('userListPath', () => {
  it('uses /users and omits defaults', () => {
    expect(userListPath({})).toBe('/users')
    expect(userListPath({ q: 'pat', disabled: 'yes' })).toBe(
      '/users?q=pat&disabled=1',
    )
    expect(userListPath({ worker: 'yes', after: 'u9' })).toBe(
      '/users?worker=1&after=u9',
    )
  })
})
