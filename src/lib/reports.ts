export type ReportReason =
  | 'SPAM'
  | 'HARASSMENT'
  | 'ILLEGAL_OR_PROHIBITED'
  | 'SCAM'
  | 'OTHER'

export type ReportStatus = 'OPEN' | 'REVIEWED' | 'ACTIONED' | 'DISMISSED'
export type ReportTargetType = 'TASK' | 'WORKER' | 'USER'

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
]

export type ReportStatusFilter = ReportStatus | 'ALL'
export type ReportTargetTypeFilter = ReportTargetType | 'ALL'

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
  /** Live BE-46 field. Linked task title (or worker/user label). */
  targetLabel?: string | null
  reporterEmail?: string | null
  reporter?: {
    id: string
    email: string
    profile?: { name?: string | null } | null
  } | null
}

export type ReportApiPayload = {
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
  targetLabel?: string | null
  /** Stub used before BE-46 shipped `targetLabel`. */
  targetTitle?: string | null
  reporterEmail?: string | null
  reporter?: ReportRow['reporter']
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
  if (value === 'ALL' || value === 'WORKER' || value === 'USER') return value
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

export function filterReportsByTargetType(
  items: ReportRow[],
  targetType: ReportTargetTypeFilter,
): ReportRow[] {
  if (targetType === 'ALL') return items
  return items.filter((row) => row.targetType === targetType)
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

export function reportFromApi(row: ReportApiPayload): ReportRow {
  const targetLabel =
    row.targetLabel?.trim() || row.targetTitle?.trim() || null
  const reporterEmail =
    row.reporterEmail?.trim() || row.reporter?.email?.trim() || null
  return {
    id: row.id,
    targetId: row.targetId,
    targetType: row.targetType,
    reason: row.reason,
    details: row.details,
    status: row.status,
    targetUrl: row.targetUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    reporterUserId: row.reporterUserId,
    targetLabel,
    reporterEmail,
    reporter: row.reporter ?? null,
  }
}

/** Status mutations often return core fields only; keep list enrichment. */
export function mergeReportRow(
  current: ReportRow,
  updated: ReportRow,
): ReportRow {
  return {
    ...current,
    ...updated,
    targetLabel: updated.targetLabel || current.targetLabel,
    reporterEmail: updated.reporterEmail || current.reporterEmail,
    reporter: updated.reporter || current.reporter,
    details: updated.details ?? current.details,
    targetUrl: updated.targetUrl ?? current.targetUrl,
  }
}

export function reportsPath(input: {
  status?: ReportStatusFilter
  targetType?: ReportTargetTypeFilter
}): string {
  const params = new URLSearchParams()
  if (input.status && input.status !== 'ALL') params.set('status', input.status)
  if (input.targetType && input.targetType !== 'TASK') {
    params.set('targetType', input.targetType)
  }
  const qs = params.toString()
  return qs ? `/reports?${qs}` : '/reports'
}
