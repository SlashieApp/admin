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

/** Start of a YYYY-MM-DD day in UTC, for inclusive `createdAfter` API bounds. */
export function dayStartIso(day: string): string | undefined {
  return day ? `${day}T00:00:00.000Z` : undefined
}

/** End of a YYYY-MM-DD day in UTC, for inclusive `createdBefore` API bounds. */
export function dayEndIso(day: string): string | undefined {
  return day ? `${day}T23:59:59.999Z` : undefined
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
