/**
 * Unlimited given in admin (BE-117 / FE-443): a god-mode edit, as if the
 * worker had paid with no auto-renew. The API keeps it apart from Stripe and
 * the worker's plan reads like a paid one until it ends.
 */

export type UnlimitedLength =
  | '1m'
  | '3m'
  | '6m'
  | '1y'
  | 'date'
  | 'never'

export const UNLIMITED_LENGTHS: readonly { value: UnlimitedLength; label: string }[] = [
  { value: '1m', label: '1 month' },
  { value: '3m', label: '3 months' },
  { value: '6m', label: '6 months' },
  { value: '1y', label: '1 year' },
  { value: 'date', label: 'Until a date' },
  { value: 'never', label: 'Never expires' },
]

const MONTHS: Partial<Record<UnlimitedLength, number>> = {
  '1m': 1,
  '3m': 3,
  '6m': 6,
  '1y': 12,
}

/**
 * When it ends: `null` for no end; a calendar date (`YYYY-MM-DD`) ends at the
 * end of that day, local time. Returns an error message for a missing or past
 * date.
 */
export function unlimitedUntil(
  length: UnlimitedLength,
  date: string,
  now: Date = new Date(),
): { until: Date | null } | { error: string } {
  if (length === 'never') return { until: null }
  const months = MONTHS[length]
  if (months) {
    const until = new Date(now)
    until.setMonth(until.getMonth() + months)
    return { until }
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) return { error: 'Pick an end date.' }
  const until = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    23,
    59,
    59,
    999,
  )
  if (until.getTime() <= now.getTime()) {
    return { error: 'The end date must be in the future.' }
  }
  return { until }
}

export type AdminUnlimitedView = {
  until?: unknown
  grantedAt?: unknown
  grantedBy?: string | null
} | null

/** Whether an admin-given Unlimited is still running. */
export function unlimitedIsActive(
  given: AdminUnlimitedView | undefined,
  now: Date = new Date(),
): boolean {
  if (!given) return false
  if (given.until == null) return true
  return new Date(String(given.until)).getTime() > now.getTime()
}

/** "Given by Ops on 25 Oct 2026, until 25 Nov 2026" / ", no end" / ", ended …". */
export function describeUnlimited(
  given: AdminUnlimitedView | undefined,
  now: Date = new Date(),
): string | null {
  if (!given) return null
  const by = given.grantedBy?.trim() || 'an admin'
  const on = formatDay(given.grantedAt)
  if (given.until == null) return `Given by ${by} on ${on}, no end.`
  const until = formatDay(given.until)
  return unlimitedIsActive(given, now)
    ? `Given by ${by} on ${on}, until ${until}.`
    : `Given by ${by} on ${on}. Ended ${until}.`
}

/**
 * True when the worker pays through Stripe right now. The plan reads like a
 * paid one while Unlimited is given too, so a plan whose end is exactly the
 * given end (or has no end while the given one has none) is the given one.
 */
export function hasPaidPlan(
  membership: {
    subscriptionStatus: string
    currentPeriodEnd?: unknown
  } | null | undefined,
  given: AdminUnlimitedView | undefined,
  now: Date = new Date(),
): boolean {
  if (!membership) return false
  if (membership.subscriptionStatus === 'TRIALING') return true
  if (membership.subscriptionStatus !== 'ACTIVE') return false
  if (!unlimitedIsActive(given, now)) return true
  const planEnd = timeOf(membership.currentPeriodEnd)
  const givenEnd = timeOf(given?.until)
  return planEnd !== givenEnd
}

function timeOf(value: unknown): number | null {
  if (value == null || value === '') return null
  const time = new Date(String(value)).getTime()
  return Number.isNaN(time) ? null : time
}

function formatDay(value: unknown): string {
  const time = timeOf(value)
  if (time == null) return 'an unknown date'
  return new Date(time).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
