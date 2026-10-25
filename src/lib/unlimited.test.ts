import { describe, expect, it } from 'vitest'

import {
  describeUnlimited,
  hasPaidPlan,
  unlimitedIsActive,
  unlimitedUntil,
} from './unlimited'

const NOW = new Date(2026, 9, 25, 12, 0, 0)

describe('unlimitedUntil', () => {
  it('adds calendar months for the presets', () => {
    expect(unlimitedUntil('1m', '', NOW)).toEqual({ until: new Date(2026, 10, 25, 12, 0, 0) })
    expect(unlimitedUntil('1y', '', NOW)).toEqual({ until: new Date(2027, 9, 25, 12, 0, 0) })
  })

  it('never has no end', () => {
    expect(unlimitedUntil('never', '', NOW)).toEqual({ until: null })
  })

  it('a date ends at the end of that day, and must be in the future', () => {
    expect(unlimitedUntil('date', '2026-12-31', NOW)).toEqual({
      until: new Date(2026, 11, 31, 23, 59, 59, 999),
    })
    expect(unlimitedUntil('date', '', NOW)).toEqual({ error: 'Pick an end date.' })
    expect(unlimitedUntil('date', '2026-10-24', NOW)).toEqual({
      error: 'The end date must be in the future.',
    })
  })
})

describe('describeUnlimited', () => {
  const grantedAt = new Date(2026, 9, 1).toISOString()
  it('says who, when and until', () => {
    expect(
      describeUnlimited(
        { grantedBy: 'Ops', grantedAt, until: new Date(2026, 10, 1).toISOString() },
        NOW,
      ),
    ).toBe('Given by Ops on 1 Oct 2026, until 1 Nov 2026.')
    expect(describeUnlimited({ grantedBy: null, grantedAt, until: null }, NOW)).toBe(
      'Given by an admin on 1 Oct 2026, no end.',
    )
    expect(
      describeUnlimited(
        { grantedBy: 'Ops', grantedAt, until: new Date(2026, 9, 20).toISOString() },
        NOW,
      ),
    ).toBe('Given by Ops on 1 Oct 2026. Ended 20 Oct 2026.')
    expect(describeUnlimited(null, NOW)).toBeNull()
  })
})

describe('hasPaidPlan', () => {
  const until = new Date(2026, 10, 25).toISOString()
  it('a trial or an active plan with nothing given is paid', () => {
    expect(hasPaidPlan({ subscriptionStatus: 'TRIALING' }, null, NOW)).toBe(true)
    expect(hasPaidPlan({ subscriptionStatus: 'ACTIVE', currentPeriodEnd: until }, null, NOW)).toBe(true)
    expect(hasPaidPlan({ subscriptionStatus: 'NONE' }, null, NOW)).toBe(false)
  })

  it('the plan the given Unlimited makes is not paid', () => {
    const given = { until, grantedAt: NOW.toISOString(), grantedBy: 'Ops' }
    expect(hasPaidPlan({ subscriptionStatus: 'ACTIVE', currentPeriodEnd: until }, given, NOW)).toBe(false)
    const forever = { until: null, grantedAt: NOW.toISOString(), grantedBy: 'Ops' }
    expect(hasPaidPlan({ subscriptionStatus: 'ACTIVE', currentPeriodEnd: null }, forever, NOW)).toBe(false)
  })

  it('a paid plan renewing on another date still shows as paid', () => {
    const forever = { until: null, grantedAt: NOW.toISOString(), grantedBy: 'Ops' }
    expect(
      hasPaidPlan({ subscriptionStatus: 'ACTIVE', currentPeriodEnd: until }, forever, NOW),
    ).toBe(true)
  })

  it('unlimitedIsActive', () => {
    expect(unlimitedIsActive({ until: null }, NOW)).toBe(true)
    expect(unlimitedIsActive({ until: new Date(2026, 9, 1).toISOString() }, NOW)).toBe(false)
  })
})
