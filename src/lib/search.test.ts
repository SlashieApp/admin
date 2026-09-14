import { describe, expect, it } from 'vitest'

import {
  DEFAULT_ADMIN_PAGE_SIZE,
  parseAdminHomeMode,
  toAdminSearchVariables,
  toAdminTaskListVariables,
  toAdminTaskVariables,
  toAdminUserListVariables,
} from './search'

describe('toAdminSearchVariables', () => {
  it('sends free text as search only', () => {
    expect(toAdminSearchVariables('  leaky tap ')).toEqual({
      search: 'leaky tap',
    })
  })

  it('also passes id when the query looks like an id', () => {
    expect(toAdminSearchVariables('507f1f77bcf86cd799439011')).toEqual({
      search: '507f1f77bcf86cd799439011',
      id: '507f1f77bcf86cd799439011',
    })
  })

  it('returns empty vars for blank input', () => {
    expect(toAdminSearchVariables('   ')).toEqual({})
  })
})

describe('toAdminTaskListVariables', () => {
  it('omits filter on empty query so login can load newest tasks', () => {
    expect(toAdminTaskListVariables('')).toEqual({
      first: DEFAULT_ADMIN_PAGE_SIZE,
    })
    expect(toAdminTaskListVariables('   ')).toEqual({
      first: DEFAULT_ADMIN_PAGE_SIZE,
    })
    expect(toAdminTaskVariables('')).toEqual({
      first: DEFAULT_ADMIN_PAGE_SIZE,
    })
  })

  it('puts free text in filter.search', () => {
    expect(toAdminTaskListVariables(' leaky tap ')).toEqual({
      first: DEFAULT_ADMIN_PAGE_SIZE,
      filter: { search: 'leaky tap' },
    })
  })

  it('puts id-like queries in both search and id', () => {
    expect(toAdminTaskListVariables('507f1f77bcf86cd799439011')).toEqual({
      first: DEFAULT_ADMIN_PAGE_SIZE,
      filter: {
        search: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
      },
    })
  })
})

describe('toAdminUserListVariables', () => {
  it('loads recent users when search is empty', () => {
    expect(toAdminUserListVariables('')).toEqual({
      first: DEFAULT_ADMIN_PAGE_SIZE,
    })
  })

  it('searches email or name', () => {
    expect(toAdminUserListVariables('ryan@slashie.app')).toEqual({
      first: DEFAULT_ADMIN_PAGE_SIZE,
      search: 'ryan@slashie.app',
    })
  })

  it('also passes id when the query looks like an id', () => {
    expect(toAdminUserListVariables('507f1f77bcf86cd799439011')).toEqual({
      first: DEFAULT_ADMIN_PAGE_SIZE,
      search: '507f1f77bcf86cd799439011',
      id: '507f1f77bcf86cd799439011',
    })
  })
})

describe('parseAdminHomeMode', () => {
  it('defaults to tasks', () => {
    expect(parseAdminHomeMode(null)).toBe('tasks')
    expect(parseAdminHomeMode(undefined)).toBe('tasks')
    expect(parseAdminHomeMode('nope')).toBe('tasks')
  })

  it('accepts users and ignores the old workers tab', () => {
    expect(parseAdminHomeMode('users')).toBe('users')
    expect(parseAdminHomeMode('workers')).toBe('tasks')
  })
})
