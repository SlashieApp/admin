import { describe, expect, it } from 'vitest'

import { slashieFaviconSrc, slashieMarkSrc, slashieWordmarkSrc } from './brand'

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

describe('slashieFaviconSrc', () => {
  it('uses the same green mark in the browser tab', () => {
    expect(slashieFaviconSrc()).toBe('/images/slashie-mark.svg')
  })
})
