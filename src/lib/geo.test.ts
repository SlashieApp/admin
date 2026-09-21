import { describe, expect, it } from 'vitest'

import {
  bboxEquals,
  bboxFromCorners,
  isValidBBox,
  nextDeniedFilterKeys,
  omitFilterKeys,
  parseCoord,
  pointInBBox,
  proposedFilterKeyFromError,
  roundBBox,
} from './geo'

describe('parseCoord', () => {
  it('accepts finite numbers and numeric strings', () => {
    expect(parseCoord(51.5)).toBe(51.5)
    expect(parseCoord(' -0.12 ')).toBe(-0.12)
    expect(parseCoord('')).toBeNull()
    expect(parseCoord('n/a')).toBeNull()
  })
})

describe('bbox', () => {
  const london = {
    swLat: 51.4,
    swLng: -0.2,
    neLat: 51.6,
    neLng: 0.1,
  }

  it('rounds and compares viewports', () => {
    expect(
      bboxEquals(london, {
        swLat: 51.40004,
        swLng: -0.20003,
        neLat: 51.60002,
        neLng: 0.10001,
      }),
    ).toBe(true)
    expect(roundBBox({ ...london, swLat: 51.40004 }).swLat).toBe(51.4)
  })

  it('rejects inverted or non-finite boxes', () => {
    expect(isValidBBox({ ...london, swLat: 52 })).toBe(false)
    expect(bboxFromCorners({ south: 1, west: 1, north: 1, east: 2 })).toBeNull()
  })

  it('tests whether a pin sits in the viewport', () => {
    expect(pointInBBox(51.5, -0.1, london)).toBe(true)
    expect(pointInBBox(52, -0.1, london)).toBe(false)
  })
})

describe('proposedFilterKeyFromError', () => {
  it('reads the unknown AdminTaskFilter field from a GraphQL error', () => {
    expect(
      proposedFilterKeyFromError(
        'Field "bbox" is not defined by type "AdminTaskFilter".',
      ),
    ).toBe('bbox')
    expect(
      proposedFilterKeyFromError('Unknown argument "filter" on field Query.x'),
    ).toBeNull()
  })
})

describe('nextDeniedFilterKeys', () => {
  it('denies only the named field when the error mentions it', () => {
    expect(
      nextDeniedFilterKeys(
        ['bbox', 'category'],
        'Field "bbox" is not defined by type "AdminTaskFilter".',
      ),
    ).toEqual(['bbox'])
  })

  it('denies every proposed key that was sent when the error is generic', () => {
    expect(
      nextDeniedFilterKeys(['category', 'posterSearch'], 'Unknown argument'),
    ).toEqual(['category', 'posterSearch'])
  })
})

describe('omitFilterKeys', () => {
  it('drops denied keys so the panel can retry the live contract', () => {
    expect(
      omitFilterKeys(
        { search: 'tap', bbox: { swLat: 1 }, category: 'PLUMBING' },
        ['bbox', 'category'],
      ),
    ).toEqual({ search: 'tap' })
  })
})
