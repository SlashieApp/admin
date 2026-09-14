import { describe, expect, it } from 'vitest'

import {
  buildAdminUpdateUserInput,
  isWorkerUser,
  userToFormValues,
} from './userInput'

describe('userToFormValues + buildAdminUpdateUserInput', () => {
  it('round-trips profile and verification flags', () => {
    const values = userToFormValues({
      emailVerified: true,
      phoneVerified: false,
      profile: {
        name: 'Alex Poster',
        contactNumber: '+447700900123',
        bio: 'Needs a plumber',
      },
    })

    expect(buildAdminUpdateUserInput(values)).toEqual({
      name: 'Alex Poster',
      contactNumber: '+447700900123',
      emailVerified: true,
      phoneVerified: false,
    })
  })

  it('sends empty optional strings as null so ops can clear them', () => {
    const values = userToFormValues({
      emailVerified: false,
      profile: { name: '  ', contactNumber: '', bio: null },
    })
    expect(buildAdminUpdateUserInput(values)).toEqual({
      name: null,
      contactNumber: null,
      emailVerified: false,
      phoneVerified: false,
    })
  })
})

describe('isWorkerUser', () => {
  it('is true only when a linked worker profile id exists', () => {
    expect(isWorkerUser({ worker: { id: 'w1' } })).toBe(true)
    expect(isWorkerUser({ worker: null })).toBe(false)
    expect(isWorkerUser({})).toBe(false)
  })
})
