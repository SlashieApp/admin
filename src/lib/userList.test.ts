import { describe, expect, it } from 'vitest'

import { DEFAULT_ADMIN_PAGE_SIZE } from './search'
import {
  applyUserClientFilters,
  parseUserListFilters,
  sortUserRows,
  toAdminUserListVariablesFromFilters,
  userClientFilterActive,
  userListPath,
  type UserListRow,
} from './userList'

function user(partial: Partial<UserListRow> & Pick<UserListRow, 'id'>): UserListRow {
  return {
    email: 'pat@x.com',
    disabled: false,
    createdAt: '2026-09-18T12:00:00.000Z',
    profile: { name: 'Pat Lee' },
    worker: null,
    ...partial,
  }
}

describe('userListPath', () => {
  it('uses /users and keeps /?mode=users bookmarks', () => {
    expect(userListPath({})).toBe('/users')
    expect(userListPath({ q: 'pat' }, '/users')).toBe('/users?q=pat')
    expect(userListPath({ q: 'pat' }, '/')).toBe('/?mode=users&q=pat')
  })
})

describe('toAdminUserListVariablesFromFilters', () => {
  it('only sends search/id/first — disabled/worker are not on adminUsers', () => {
    expect(
      toAdminUserListVariablesFromFilters(parseUserListFilters(new URLSearchParams())),
    ).toEqual({ first: DEFAULT_ADMIN_PAGE_SIZE })
    expect(
      toAdminUserListVariablesFromFilters(
        parseUserListFilters(new URLSearchParams('q=pat@x.com')),
      ),
    ).toEqual({ first: DEFAULT_ADMIN_PAGE_SIZE, search: 'pat@x.com' })
  })
})

describe('applyUserClientFilters', () => {
  const rows = [
    user({ id: '1' }),
    user({
      id: '2',
      email: 'sam@x.com',
      profile: { name: 'Sam' },
      disabled: true,
      worker: { id: 'w1' },
      createdAt: '2026-08-01T00:00:00.000Z',
    }),
  ]

  it('filters email, name, disabled, worker, and dates on the fetched page', () => {
    expect(
      applyUserClientFilters(rows, parseUserListFilters(new URLSearchParams('email=sam'))).map(
        (row) => row.id,
      ),
    ).toEqual(['2'])
    expect(
      applyUserClientFilters(rows, parseUserListFilters(new URLSearchParams('name=lee'))).map(
        (row) => row.id,
      ),
    ).toEqual(['1'])
    expect(
      applyUserClientFilters(rows, parseUserListFilters(new URLSearchParams('disabled=yes'))).map(
        (row) => row.id,
      ),
    ).toEqual(['2'])
    expect(
      applyUserClientFilters(rows, parseUserListFilters(new URLSearchParams('worker=no'))).map(
        (row) => row.id,
      ),
    ).toEqual(['1'])
    expect(
      applyUserClientFilters(rows, parseUserListFilters(new URLSearchParams('from=2026-09-01'))).map(
        (row) => row.id,
      ),
    ).toEqual(['1'])
  })
})

describe('sortUserRows', () => {
  it('sorts by email', () => {
    const rows = sortUserRows(
      [user({ id: 'b', email: 'b@x.com' }), user({ id: 'a', email: 'a@x.com' })],
      parseUserListFilters(new URLSearchParams('sort=email&dir=asc')),
    )
    expect(rows.map((row) => row.id)).toEqual(['a', 'b'])
  })
})

describe('userClientFilterActive', () => {
  it('flags page-local filters', () => {
    expect(userClientFilterActive(parseUserListFilters(new URLSearchParams()))).toBe(
      false,
    )
    expect(
      userClientFilterActive(parseUserListFilters(new URLSearchParams('worker=yes'))),
    ).toBe(true)
  })
})
