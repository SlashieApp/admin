export type AdminOpsRange =
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'THIS_MONTH'
  | 'LAST_MONTH'

export const ADMIN_OPS_RANGES: { value: AdminOpsRange; label: string }[] = [
  { value: 'LAST_7_DAYS', label: 'Last 7 days' },
  { value: 'LAST_30_DAYS', label: 'Last 30 days' },
  { value: 'THIS_MONTH', label: 'This month' },
  { value: 'LAST_MONTH', label: 'Last month' },
]

export function parseAdminOpsRange(
  value: string | null | undefined,
): AdminOpsRange {
  if (
    value === 'LAST_30_DAYS' ||
    value === 'THIS_MONTH' ||
    value === 'LAST_MONTH' ||
    value === 'LAST_7_DAYS'
  ) {
    return value
  }
  return 'LAST_7_DAYS'
}

export function rangeToHogqlWhere(range: AdminOpsRange): string {
  switch (range) {
    case 'LAST_30_DAYS':
      return 'timestamp >= now() - INTERVAL 30 DAY'
    case 'THIS_MONTH':
      return 'timestamp >= toStartOfMonth(now())'
    case 'LAST_MONTH':
      return 'timestamp >= toStartOfMonth(now() - INTERVAL 1 MONTH) AND timestamp < toStartOfMonth(now())'
    default:
      return 'timestamp >= now() - INTERVAL 7 DAY'
  }
}

export function formatChangePct(value?: number | null): string {
  if (value == null || Number.isNaN(Number(value))) return '—'
  const rounded = Math.round(Number(value) * 10) / 10
  const shown = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
  const sign = rounded > 0 ? '+' : ''
  return `${sign}${shown}%`
}
