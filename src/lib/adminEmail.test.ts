import { describe, expect, it } from 'vitest'

import {
  emailFromGoogleIdToken,
  isSlashieAdminEmail,
  looksLikeId,
} from './adminEmail'

describe('isSlashieAdminEmail', () => {
  it('allows @slashie.app emails', () => {
    expect(isSlashieAdminEmail('admin@slashie.app')).toBe(true)
    expect(isSlashieAdminEmail('  Ryan@Slashie.APP  ')).toBe(true)
  })

  it('rejects other domains and empty values', () => {
    expect(isSlashieAdminEmail('admin@gmail.com')).toBe(false)
    expect(isSlashieAdminEmail('slashie.app@example.com')).toBe(false)
    expect(isSlashieAdminEmail('')).toBe(false)
    expect(isSlashieAdminEmail(null)).toBe(false)
  })
})

describe('emailFromGoogleIdToken', () => {
  it('reads email from a JWT payload', () => {
    const payload = btoa(JSON.stringify({ email: 'admin@slashie.app' }))
    expect(emailFromGoogleIdToken(`aaa.${payload}.ccc`)).toBe(
      'admin@slashie.app',
    )
  })

  it('returns null for garbage', () => {
    expect(emailFromGoogleIdToken('not-a-jwt')).toBeNull()
  })
})

describe('looksLikeId', () => {
  it('accepts Mongo ObjectIds and UUIDs', () => {
    expect(looksLikeId('507f1f77bcf86cd799439011')).toBe(true)
    expect(looksLikeId('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
  })

  it('rejects free text', () => {
    expect(looksLikeId('leaky tap')).toBe(false)
  })
})
