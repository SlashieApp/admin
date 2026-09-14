import { describe, expect, it } from 'vitest'

import { slashieMarkSrc, slashieWordmarkSrc } from './brand'

describe('slashieWordmarkSrc', () => {
  it('uses the white wordmark on a dark header for contrast', () => {
    expect(slashieWordmarkSrc('dark')).toBe('/images/slashie-logo-dark.svg')
  })

  it('uses the black wordmark on a light surface for contrast', () => {
    expect(slashieWordmarkSrc('light')).toBe('/images/slashie-logo-light.svg')
  })
})

describe('slashieMarkSrc', () => {
  it('points at the copied green mark asset', () => {
    expect(slashieMarkSrc()).toBe('/images/slashie-mark.svg')
  })
})
