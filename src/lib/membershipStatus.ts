/**
 * The worker's plan status as one line for the plan panel (BE-133). The API's
 * `statusLabel` and `statusDescription` are gone; this builds the same words
 * from the status and dates (admin is English only).
 */

export type MembershipStatusInput = {
  subscriptionStatus: string
  trialEndsAt?: string | null
  currentPeriodEnd?: string | null
  cancelAtPeriodEnd?: boolean | null
}

const LABELS: Record<string, string> = {
  NONE: 'Free',
  TRIALING: 'Trial',
  ACTIVE: 'Active',
  PAST_DUE: 'Past due',
  CANCELED: 'Canceled',
  UNPAID: 'Unpaid',
  INCOMPLETE: 'Incomplete',
  INCOMPLETE_EXPIRED: 'Expired',
  PAUSED: 'Paused',
}

function day(iso: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** e.g. "Trial · ends 9 Dec 2026", "Cancelling · Pro until 9 Dec 2026", "Past due · update payment method". */
export function membershipStatusLine(m: MembershipStatusInput): string {
  const status = m.subscriptionStatus
  const live = status === 'TRIALING' || status === 'ACTIVE'
  if (live && m.cancelAtPeriodEnd) {
    const end = day(status === 'TRIALING' ? (m.trialEndsAt ?? m.currentPeriodEnd) : m.currentPeriodEnd)
    return end ? `Cancelling · Pro until ${end}` : 'Cancelling'
  }
  const label = LABELS[status] ?? status
  switch (status) {
    case 'TRIALING': {
      const end = day(m.trialEndsAt)
      return end ? `${label} · ends ${end}` : label
    }
    case 'ACTIVE': {
      const end = day(m.currentPeriodEnd)
      return end ? `${label} · renews ${end}` : label
    }
    case 'PAST_DUE':
      return `${label} · update payment method`
    case 'UNPAID':
      return `${label} · subscription unpaid`
    case 'INCOMPLETE':
      return `${label} · checkout not finished`
    default:
      return label
  }
}
