import { afterEach, describe, expect, it } from 'vitest'

import { publicAppOrigin, publicTaskUrl } from './publicLinks'

const ORIGINAL_APP_URL = process.env.NEXT_PUBLIC_APP_URL

afterEach(() => {
  if (ORIGINAL_APP_URL == null) delete process.env.NEXT_PUBLIC_APP_URL
  else process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_APP_URL
})

describe('publicTaskUrl', () => {
  it('defaults to the live Slashie origin', () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    expect(publicAppOrigin()).toBe('https://slashie.app')
    expect(publicTaskUrl('abc123')).toBe('https://slashie.app/tasks/abc123')
  })

  it('uses NEXT_PUBLIC_APP_URL when set', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://www.slashie.app/'
    expect(publicTaskUrl('task-1')).toBe('https://www.slashie.app/tasks/task-1')
  })
})
