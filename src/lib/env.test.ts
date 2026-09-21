import { describe, expect, it } from 'vitest'

import { mapboxStyleUrl, publicAppOrigin, publicTaskUrl } from './env'

describe('public marketplace URLs', () => {
  it('defaults to slashie.app task pages', () => {
    expect(publicAppOrigin()).toBe('https://slashie.app')
    expect(publicTaskUrl('t1')).toBe('https://slashie.app/tasks/t1')
  })
})

describe('mapboxStyleUrl', () => {
  it('uses Mapbox light streets when no custom style is set', () => {
    expect(mapboxStyleUrl()).toBe('mapbox://styles/mapbox/light-v11')
  })
})
