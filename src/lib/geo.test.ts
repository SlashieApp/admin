import { describe, expect, it } from 'vitest'

import {
  bboxToParam,
  bboxesEqual,
  parseBBoxParam,
  pointInBBox,
  taskCoordinates,
} from './geo'

describe('parseBBoxParam', () => {
  it('reads swLat,swLng,neLat,neLng', () => {
    expect(parseBBoxParam('51.4,-0.2,51.6,0.1')).toEqual({
      swLat: 51.4,
      swLng: -0.2,
      neLat: 51.6,
      neLng: 0.1,
    })
  })

  it('rejects inverted or incomplete values', () => {
    expect(parseBBoxParam('')).toBeNull()
    expect(parseBBoxParam('51.4,-0.2,51.6')).toBeNull()
    expect(parseBBoxParam('51.6,-0.2,51.4,0.1')).toBeNull()
  })
})

describe('bboxToParam / bboxesEqual', () => {
  it('round-trips and compares at 5 decimal places', () => {
    const bbox = parseBBoxParam('51.50123,-0.12789,51.61,0.1')
    expect(bbox).not.toBeNull()
    expect(bboxToParam(bbox!)).toBe('51.50123,-0.12789,51.61,0.1')
    expect(bboxesEqual(bbox, parseBBoxParam(bboxToParam(bbox!)))).toBe(true)
    expect(bboxesEqual(bbox, null)).toBe(false)
    expect(bboxesEqual(null, null)).toBe(true)
  })
})

describe('pointInBBox', () => {
  const london = parseBBoxParam('51.4,-0.2,51.6,0.1')!

  it('includes points inside the viewport', () => {
    expect(pointInBBox({ lat: 51.5, lng: -0.1 }, london)).toBe(true)
    expect(pointInBBox({ lat: 52, lng: -0.1 }, london)).toBe(false)
  })
})

describe('taskCoordinates', () => {
  it('returns lat/lng when both are real numbers', () => {
    expect(taskCoordinates({ lat: 51.5, lng: -0.12 })).toEqual({
      lat: 51.5,
      lng: -0.12,
    })
  })

  it('skips missing and 0,0 placeholders', () => {
    expect(taskCoordinates(null)).toBeNull()
    expect(taskCoordinates({ lat: 51.5, lng: null })).toBeNull()
    expect(taskCoordinates({ lat: 0, lng: 0 })).toBeNull()
  })
})
