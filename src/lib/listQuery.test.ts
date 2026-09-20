import { describe, expect, it } from 'vitest'

import {
  compareValues,
  hasMoreWithoutCursor,
  matchesDateRange,
  matchesText,
  parseCursor,
  parseIsoDate,
  parseOptionalNumber,
  parsePageSize,
  parseSortDir,
  parseTriState,
  pathWithQuery,
  setParam,
  sortBy,
  toggleSort,
  triStateToBoolean,
} from './listQuery'

describe('parsePageSize', () => {
  it('accepts 25/50/100 and falls back otherwise', () => {
    expect(parsePageSize('25')).toBe(25)
    expect(parsePageSize('100')).toBe(100)
    expect(parsePageSize('7')).toBe(50)
    expect(parsePageSize(null, 25)).toBe(25)
  })
})

describe('parse helpers', () => {
  it('parses sort, dates, numbers, cursors, and tri-state flags', () => {
    expect(parseSortDir('asc')).toBe('asc')
    expect(parseSortDir('nope')).toBe('desc')
    expect(parseIsoDate('2026-09-20')).toBe('2026-09-20')
    expect(parseIsoDate('20/09/2026')).toBe('')
    expect(parseOptionalNumber('12.5')).toBe(12.5)
    expect(parseOptionalNumber('x')).toBeUndefined()
    expect(parseCursor('  abc  ')).toBe('abc')
    expect(parseCursor('')).toBeNull()
    expect(parseTriState('yes')).toBe('yes')
    expect(parseTriState('0')).toBe('no')
    expect(parseTriState(null)).toBe('all')
    expect(triStateToBoolean('yes')).toBe(true)
    expect(triStateToBoolean('all')).toBeUndefined()
  })
})

describe('sort and match', () => {
  it('toggles direction on the same column', () => {
    expect(toggleSort('title', 'asc', 'title')).toEqual({
      sort: 'title',
      dir: 'desc',
    })
    expect(toggleSort('title', 'desc', 'budget')).toEqual({
      sort: 'budget',
      dir: 'asc',
    })
  })

  it('sorts numbers and text', () => {
    expect(compareValues(2, 10)).toBeLessThan(0)
    expect(sortBy([{ n: 2 }, { n: 1 }], 'asc', (row) => row.n).map((r) => r.n)).toEqual([
      1, 2,
    ])
    expect(matchesText(['Pat Lee', 'pat@x.com'], 'lee')).toBe(true)
    expect(matchesText(['Pat'], 'sam')).toBe(false)
  })

  it('matches inclusive date ranges from ISO or YYYY-MM-DD', () => {
    expect(
      matchesDateRange('2026-09-18T12:00:00.000Z', {
        from: '2026-09-18',
        to: '2026-09-18',
      }),
    ).toBe(true)
    expect(matchesDateRange('2026-09-17', { from: '2026-09-18' })).toBe(false)
    expect(matchesDateRange(null, { from: '2026-09-18' })).toBe(false)
    expect(matchesDateRange(null, {})).toBe(true)
  })
})

describe('query builders', () => {
  it('omits empty params and knows when a truncated page may continue', () => {
    const params = new URLSearchParams()
    setParam(params, 'q', 'tap')
    setParam(params, 'hidden', '')
    expect(pathWithQuery('/users', params)).toBe('/users?q=tap')
    expect(hasMoreWithoutCursor(50, 50)).toBe(true)
    expect(hasMoreWithoutCursor(12, 50)).toBe(false)
  })
})
