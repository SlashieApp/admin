import { describe, expect, it } from 'vitest'

import { membershipStatusLine } from './membershipStatus'

describe('membershipStatusLine (BE-133: built here, not from the API labels)', () => {
  it('names each status', () => {
    expect(membershipStatusLine({ subscriptionStatus: 'NONE' })).toBe('Free')
    expect(membershipStatusLine({ subscriptionStatus: 'CANCELED' })).toBe('Canceled')
    expect(membershipStatusLine({ subscriptionStatus: 'INCOMPLETE_EXPIRED' })).toBe('Expired')
    expect(membershipStatusLine({ subscriptionStatus: 'PAUSED' })).toBe('Paused')
  })

  it('adds the trial end and the renewal date', () => {
    expect(
      membershipStatusLine({ subscriptionStatus: 'TRIALING', trialEndsAt: '2026-12-09T10:00:00.000Z' }),
    ).toBe('Trial · ends 9 Dec 2026')
    expect(
      membershipStatusLine({ subscriptionStatus: 'ACTIVE', currentPeriodEnd: '2027-01-05T00:00:00.000Z' }),
    ).toBe('Active · renews 5 Jan 2027')
    expect(membershipStatusLine({ subscriptionStatus: 'ACTIVE' })).toBe('Active')
  })

  it('says when a live plan is cancelling, and until when', () => {
    expect(
      membershipStatusLine({
        subscriptionStatus: 'ACTIVE',
        cancelAtPeriodEnd: true,
        currentPeriodEnd: '2027-01-05T00:00:00.000Z',
      }),
    ).toBe('Cancelling · Pro until 5 Jan 2027')
    expect(
      membershipStatusLine({
        subscriptionStatus: 'TRIALING',
        cancelAtPeriodEnd: true,
        trialEndsAt: '2026-12-09T10:00:00.000Z',
      }),
    ).toBe('Cancelling · Pro until 9 Dec 2026')
  })

  it('says what a failing plan needs', () => {
    expect(membershipStatusLine({ subscriptionStatus: 'PAST_DUE' })).toBe('Past due · update payment method')
    expect(membershipStatusLine({ subscriptionStatus: 'UNPAID' })).toBe('Unpaid · subscription unpaid')
    expect(membershipStatusLine({ subscriptionStatus: 'INCOMPLETE' })).toBe('Incomplete · checkout not finished')
  })
})
