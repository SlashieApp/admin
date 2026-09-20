export const TABLE_PAGE_SIZES = [25, 50, 100] as const
export const DEFAULT_TABLE_PAGE_SIZE = 25

export type SortDir = 'asc' | 'desc'
export type TriState = 'all' | 'yes' | 'no'

export function parseOptionalString(
  value: string | null | undefined,
): string {
  return value?.trim() ?? ''
}

export function parsePageSize(
  value: string | null | undefined,
  fallback = DEFAULT_TABLE_PAGE_SIZE,
): number {
  const parsed = Number.parseInt(value ?? '', 10)
  if ((TABLE_PAGE_SIZES as readonly number[]).includes(parsed)) return parsed
  return fallback
}

export function parseSortDir(value: string | null | undefined): SortDir {
  return value === 'asc' ? 'asc' : 'desc'
}

export function parseOptionalNumber(
  value: string | null | undefined,
): number | null {
  const raw = value?.trim()
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

export function parseDateInput(value: string | null | undefined): string {
  const raw = value?.trim() ?? ''
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : ''
}

export function parseTriState(value: string | null | undefined): TriState {
  if (value === '1' || value === 'yes' || value === 'true') return 'yes'
  if (value === '0' || value === 'no' || value === 'false') return 'no'
  return 'all'
}

export function triStateToParam(value: TriState): string | null {
  if (value === 'yes') return '1'
  if (value === 'no') return '0'
  return null
}

export function includesNormalized(
  haystack: string | null | undefined,
  needle: string,
): boolean {
  const query = needle.trim().toLowerCase()
  if (!query) return true
  return (haystack ?? '').toLowerCase().includes(query)
}

export function timestampMs(value: unknown): number {
  if (value == null || value === '') return 0
  const raw = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const day = Date.parse(`${raw}T00:00:00.000Z`)
    return Number.isNaN(day) ? 0 : day
  }
  const ms = Date.parse(raw)
  return Number.isNaN(ms) ? 0 : ms
}

/** Inclusive calendar-day range in UTC. Empty bounds are ignored. */
export function inDateRange(
  value: unknown,
  from: string,
  to: string,
): boolean {
  if (!from && !to) return true
  const ms = timestampMs(value)
  if (!ms) return false
  if (from) {
    const start = timestampMs(from)
    if (start && ms < start) return false
  }
  if (to) {
    const end = Date.parse(`${to}T23:59:59.999Z`)
    if (!Number.isNaN(end) && ms > end) return false
  }
  return true
}

export function compareValues(
  left: unknown,
  right: unknown,
  dir: SortDir,
): number {
  const sign = dir === 'asc' ? 1 : -1
  if (left == null && right == null) return 0
  if (left == null) return 1
  if (right == null) return -1
  if (typeof left === 'number' && typeof right === 'number') {
    return (left - right) * sign
  }
  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: 'base',
  }) * sign
}

export function sortRows<T>(
  rows: T[],
  sort: string,
  dir: SortDir,
  getValue: (row: T, key: string) => unknown,
): T[] {
  if (!sort) return rows
  return [...rows].sort((a, b) =>
    compareValues(getValue(a, sort), getValue(b, sort), dir),
  )
}

export function pageLocalNotice(fields: string[]): string | null {
  if (fields.length === 0) return null
  return `${fields.join(', ')} refine this server page only — not a full-index filter.`
}

export function nextSort(
  currentSort: string,
  currentDir: SortDir,
  key: string,
): { sort: string; dir: SortDir } {
  if (currentSort === key) {
    return { sort: key, dir: currentDir === 'desc' ? 'asc' : 'desc' }
  }
  return { sort: key, dir: 'asc' }
}

export function setParam(
  params: URLSearchParams,
  key: string,
  value: string | number | null | undefined,
) {
  if (value == null) return
  const text = String(value).trim()
  if (!text) return
  params.set(key, text)
}
