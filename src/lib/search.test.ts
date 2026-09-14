import { describe, expect, it } from 'vitest'

import { toAdminSearchVariables, toAdminTaskVariables } from './search'

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

describe('toAdminTaskVariables', () => {
  it('wraps search in AdminTaskFilter', () => {
    expect(toAdminTaskVariables('  leaky tap ')).toEqual({
      filter: { search: 'leaky tap' },
    })
  })

  it('wraps id lookups in AdminTaskFilter', () => {
    expect(toAdminTaskVariables('507f1f77bcf86cd799439011')).toEqual({
      filter: {
        search: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
      },
    })
  })

  it('returns empty vars for blank input', () => {
    expect(toAdminTaskVariables('   ')).toEqual({})
  })
})
