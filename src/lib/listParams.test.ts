import { describe, expect, it } from 'vitest'

import {
  compareValues,
  inDateRange,
  includesNormalized,
  nextSort,
  pageLocalNotice,
  parseDateInput,
  parseOptionalNumber,
  parsePageSize,
  parseSortDir,
  parseTriState,
  sortRows,
  triStateToParam,
} from './listParams'

describe('parsePageSize', () => {
  it('accepts the ops page sizes and defaults otherwise', () => {
    expect(parsePageSize('25')).toBe(25)
    expect(parsePageSize('50')).toBe(50)
    expect(parsePageSize('100')).toBe(100)
    expect(parsePageSize('12')).toBe(25)
    expect(parsePageSize(null)).toBe(25)
  })
})

describe('parseSortDir', () => {
  it('defaults to desc', () => {
    expect(parseSortDir(null)).toBe('desc')
    expect(parseSortDir('asc')).toBe('asc')
    expect(parseSortDir('nope')).toBe('desc')
  })
})

describe('parseOptionalNumber / parseDateInput / parseTriState', () => {
  it('parses numbers and rejects junk', () => {
    expect(parseOptionalNumber('40')).toBe(40)
    expect(parseOptionalNumber('')).toBeNull()
    expect(parseOptionalNumber('nope')).toBeNull()
  })

  it('keeps YYYY-MM-DD dates only', () => {
    expect(parseDateInput('2026-09-18')).toBe('2026-09-18')
    expect(parseDateInput('18/09/2026')).toBe('')
  })

  it('maps 1/0 to yes/no', () => {
    expect(parseTriState('1')).toBe('yes')
    expect(parseTriState('0')).toBe('no')
    expect(parseTriState(null)).toBe('all')
    expect(triStateToParam('yes')).toBe('1')
    expect(triStateToParam('all')).toBeNull()
  })
})

describe('inDateRange', () => {
  it('includes the start and end calendar days', () => {
    expect(
      inDateRange('2026-09-18T12:00:00.000Z', '2026-09-18', '2026-09-18'),
    ).toBe(true)
    expect(
      inDateRange('2026-09-17T23:00:00.000Z', '2026-09-18', ''),
    ).toBe(false)
    expect(inDateRange('2026-09-19T00:00:00.000Z', '', '2026-09-18')).toBe(
      false,
    )
    expect(inDateRange('2026-09-18', '2026-09-18', '2026-09-20')).toBe(true)
  })
})

describe('sortRows', () => {
  it('sorts numbers and strings', () => {
    const rows = [
      { id: 'a', n: 2, label: 'Beta' },
      { id: 'b', n: 10, label: 'Alpha' },
    ]
    expect(
      sortRows(rows, 'n', 'asc', (row, key) =>
        key === 'n' ? row.n : row.label,
      ).map((row) => row.id),
    ).toEqual(['a', 'b'])
    expect(
      sortRows(rows, 'label', 'asc', (row, key) =>
        key === 'n' ? row.n : row.label,
      ).map((row) => row.id),
    ).toEqual(['b', 'a'])
  })
})

describe('helpers', () => {
  it('does case-insensitive includes and builds a page-local notice', () => {
    expect(includesNormalized('Sam Lee', 'lee')).toBe(true)
    expect(includesNormalized('Sam Lee', 'pat')).toBe(false)
    expect(pageLocalNotice([])).toBeNull()
    expect(pageLocalNotice(['Poster'])).toContain('Poster')
  })

  it('compares nulls last', () => {
    expect(compareValues(null, 1, 'asc')).toBe(1)
    expect(compareValues(1, null, 'asc')).toBe(-1)
  })

  it('toggles sort direction on the same column', () => {
    expect(nextSort('', 'desc', 'title')).toEqual({ sort: 'title', dir: 'asc' })
    expect(nextSort('title', 'asc', 'title')).toEqual({
      sort: 'title',
      dir: 'desc',
    })
  })
})
