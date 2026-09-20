export const PAGE_SIZES = [25, 50, 100] as const
export type PageSize = (typeof PAGE_SIZES)[number]

export const DEFAULT_TABLE_PAGE_SIZE: PageSize = 50

export type SortDir = 'asc' | 'desc'

export type DateRange = {
  from?: string
  to?: string
}

export function parsePageSize(
  value: string | null | undefined,
  fallback: PageSize = DEFAULT_TABLE_PAGE_SIZE,
): PageSize {
  const n = Number.parseInt(value ?? '', 10)
  return (PAGE_SIZES as readonly number[]).includes(n) ? (n as PageSize) : fallback
}

export function parseSortDir(value: string | null | undefined): SortDir {
  return value === 'asc' ? 'asc' : 'desc'
}

export function parseOptionalText(
  value: string | null | undefined,
): string {
  return value?.trim() ?? ''
}

export function parseOptionalNumber(
  value: string | null | undefined,
): number | undefined {
  if (value == null || value.trim() === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

export function parseIsoDate(value: string | null | undefined): string {
  const raw = value?.trim() ?? ''
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : ''
}

export function parseCursor(value: string | null | undefined): string | null {
  const cursor = value?.trim()
  return cursor ? cursor : null
}

export function parseTriState(
  value: string | null | undefined,
): 'all' | 'yes' | 'no' {
  if (value === 'yes' || value === 'true' || value === '1') return 'yes'
  if (value === 'no' || value === 'false' || value === '0') return 'no'
  return 'all'
}

export function triStateToBoolean(
  value: 'all' | 'yes' | 'no',
): boolean | undefined {
  if (value === 'yes') return true
  if (value === 'no') return false
  return undefined
}

export function toggleSort(
  currentSort: string,
  currentDir: SortDir,
  nextSort: string,
): { sort: string; dir: SortDir } {
  if (currentSort === nextSort) {
    return { sort: nextSort, dir: currentDir === 'asc' ? 'desc' : 'asc' }
  }
  return { sort: nextSort, dir: 'asc' }
}

export function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  const left = String(a).toLowerCase()
  const right = String(b).toLowerCase()
  return left.localeCompare(right, undefined, { numeric: true })
}

export function sortBy<T>(
  rows: T[],
  dir: SortDir,
  valueOf: (row: T) => unknown,
): T[] {
  const sign = dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => sign * compareValues(valueOf(a), valueOf(b)))
}

export function matchesText(
  haystack: Array<string | null | undefined>,
  query: string,
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return haystack.some((part) => (part ?? '').toLowerCase().includes(q))
}

/** Inclusive YYYY-MM-DD range against an ISO timestamp or date string. */
export function matchesDateRange(
  value: unknown,
  range: DateRange,
): boolean {
  if (!range.from && !range.to) return true
  if (value == null || value === '') return false
  const raw = String(value)
  const day = raw.length >= 10 ? raw.slice(0, 10) : raw
  if (range.from && day < range.from) return false
  if (range.to && day > range.to) return false
  return true
}

export function setParam(
  params: URLSearchParams,
  key: string,
  value: string | number | boolean | null | undefined,
): void {
  if (value == null || value === '' || value === false) {
    params.delete(key)
    return
  }
  params.set(key, String(value))
}

export function pathWithQuery(pathname: string, params: URLSearchParams): string {
  const qs = params.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

export function hasMoreWithoutCursor(
  fetchedCount: number,
  pageSize: number,
): boolean {
  return fetchedCount >= pageSize
}
