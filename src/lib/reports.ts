import {
  DEFAULT_TABLE_PAGE_SIZE,
  parseOptionalString,
  parsePageSize,
  parseSortDir,
  setParam,
  sortRows,
  type SortDir,
} from '@/lib/listParams'

export type ReportReason =
  | 'SPAM'
  | 'HARASSMENT'
  | 'ILLEGAL_OR_PROHIBITED'
  | 'SCAM'
  | 'OTHER'

export type ReportStatus = 'OPEN' | 'REVIEWED' | 'ACTIONED' | 'DISMISSED'
export type ReportTargetType = 'TASK' | 'WORKER' | 'USER' | 'REVIEW' | 'MESSAGE'

export const REPORT_PAGE_SIZE = 100
export const MAX_REPORT_PAGES = 10

export const REPORT_STATUSES: ReportStatus[] = [
  'OPEN',
  'REVIEWED',
  'ACTIONED',
  'DISMISSED',
]

export const REPORT_TARGET_TYPES: ReportTargetType[] = [
  'TASK',
  'WORKER',
  'USER',
  'REVIEW',
  'MESSAGE',
]

export type ReportStatusFilter = ReportStatus | 'ALL'
export type ReportTargetTypeFilter = ReportTargetType | 'ALL'

export type ReportListFilters = {
  status: ReportStatusFilter
  targetType: ReportTargetTypeFilter
  after: string
  first: number
  sort: string
  dir: SortDir
}

export type ReportRow = {
  id: string
  targetId: string
  targetType: ReportTargetType
  reason: ReportReason
  details?: string | null
  status: ReportStatus
  targetUrl?: string | null
  createdAt: unknown
  updatedAt?: unknown
  reporterUserId: string
  /** Snapshot at report time: task title, worker/user name, review stars, or message text. */
  targetLabel?: string | null
  reporterEmail?: string | null
  reporter?: {
    id: string
    email: string
    profile?: { name?: string | null } | null
  } | null
}

export type ReportPage = {
  items: ReportRow[]
  nextCursor?: string | null
}

export type AdminReportsVariables = {
  status?: ReportStatus
  targetType?: ReportTargetType
  first: number
  after?: string
}

const OPEN_FIRST_RANK: Record<ReportStatus, number> = {
  OPEN: 0,
  REVIEWED: 1,
  ACTIONED: 2,
  DISMISSED: 3,
}

export function parseReportStatusFilter(
  value: string | null | undefined,
): ReportStatusFilter {
  if (
    value === 'OPEN' ||
    value === 'REVIEWED' ||
    value === 'ACTIONED' ||
    value === 'DISMISSED'
  ) {
    return value
  }
  return 'ALL'
}

export function parseReportTargetTypeFilter(
  value: string | null | undefined,
): ReportTargetTypeFilter {
  if (value === 'ALL' || REPORT_TARGET_TYPES.includes(value as ReportTargetType)) {
    return value as ReportTargetTypeFilter
  }
  return 'TASK'
}

export function toAdminReportsVariables(input: {
  status: ReportStatusFilter
  targetType: ReportTargetTypeFilter
  after?: string | null
  first?: number
}): AdminReportsVariables {
  const vars: AdminReportsVariables = {
    first: input.first ?? REPORT_PAGE_SIZE,
  }
  if (input.status !== 'ALL') vars.status = input.status
  if (input.targetType !== 'ALL') vars.targetType = input.targetType
  if (input.after) vars.after = input.after
  return vars
}

export function createdAtMs(value: unknown): number {
  if (value == null || value === '') return 0
  const ms = Date.parse(String(value))
  return Number.isNaN(ms) ? 0 : ms
}

/**
 * API returns newest first across all statuses. Default inbox view (status=ALL)
 * reorders OPEN first so ops see the queue without hiding reviewed history.
 */
export function sortReportsOpenFirst(items: ReportRow[]): ReportRow[] {
  return [...items].sort((a, b) => {
    const rank = OPEN_FIRST_RANK[a.status] - OPEN_FIRST_RANK[b.status]
    if (rank !== 0) return rank
    return createdAtMs(b.createdAt) - createdAtMs(a.createdAt)
  })
}

export function reportTargetHref(report: ReportRow): string | null {
  if (report.targetType === 'TASK') return `/tasks/${report.targetId}`
  if (report.targetType === 'USER') return `/users/${report.targetId}`
  return null
}

export function reporterLabel(report: ReportRow): string {
  const name = report.reporter?.profile?.name?.trim()
  if (name) return name
  const email =
    report.reporter?.email?.trim() || report.reporterEmail?.trim()
  if (email) return email
  return report.reporterUserId
}

export function reporterHref(report: ReportRow): string | null {
  const id = report.reporter?.id || report.reporterUserId
  return id ? `/users/${id}` : null
}

export function taskTitle(report: ReportRow): string {
  const title = report.targetLabel?.trim()
  if (title) return title
  if (report.targetType === 'TASK') return `Task ${report.targetId}`
  return `${report.targetType} ${report.targetId}`
}

export function reportFiltersFromForm(
  data: FormData,
  current: ReportListFilters,
): ReportListFilters {
  return {
    ...current,
    status: parseReportStatusFilter(String(data.get('status') ?? '')),
    targetType: parseReportTargetTypeFilter(String(data.get('targetType') ?? '')),
    after: '',
  }
}

export function parseReportListFilters(
  params: Pick<URLSearchParams, 'get'>,
): ReportListFilters {
  return {
    status: parseReportStatusFilter(params.get('status')),
    targetType: parseReportTargetTypeFilter(params.get('targetType')),
    after: parseOptionalString(params.get('after')),
    first: parsePageSize(params.get('first')),
    sort: parseOptionalString(params.get('sort')),
    dir: parseSortDir(params.get('dir')),
  }
}

/** Sorts the fetched page only (column sort). Filters are all server-side. */
export function sortReports<T extends ReportRow>(
  rows: T[],
  filters: ReportListFilters,
): T[] {
  return sortRows(rows, filters.sort, filters.dir, reportSortValue)
}

export function reportSortValue(row: ReportRow, key: string): unknown {
  switch (key) {
    case 'target':
      return taskTitle(row)
    case 'status':
      return row.status
    case 'type':
      return row.targetType
    case 'reason':
      return row.reason
    case 'reporter':
      return reporterLabel(row)
    case 'created':
      return String(row.createdAt ?? '')
    default:
      return ''
  }
}

export function reportsPath(input: Partial<ReportListFilters> = {}): string {
  const params = new URLSearchParams()
  if (input.status && input.status !== 'ALL') params.set('status', input.status)
  if (input.targetType && input.targetType !== 'TASK') {
    params.set('targetType', input.targetType)
  }
  setParam(params, 'after', input.after)
  if (input.first && input.first !== DEFAULT_TABLE_PAGE_SIZE) {
    params.set('first', String(input.first))
  }
  setParam(params, 'sort', input.sort)
  if (input.sort && input.dir && input.dir !== 'desc') {
    params.set('dir', input.dir)
  }
  const qs = params.toString()
  return qs ? `/reports?${qs}` : '/reports'
}
