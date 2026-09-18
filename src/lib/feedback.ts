export type FeedbackCategory =
  | 'BUG'
  | 'RATING'
  | 'FEATURE_REQUEST'
  | 'GENERAL'

export type FeedbackStatus = 'OPEN' | 'REVIEWED' | 'REPLIED' | 'DISMISSED'

export const FEEDBACK_PAGE_SIZE = 100
export const MAX_FEEDBACK_PAGES = 10
export const FEEDBACK_PREVIEW_CHARS = 120

export const FEEDBACK_STATUSES: FeedbackStatus[] = [
  'OPEN',
  'REVIEWED',
  'REPLIED',
  'DISMISSED',
]

export const FEEDBACK_CATEGORIES: FeedbackCategory[] = [
  'BUG',
  'RATING',
  'FEATURE_REQUEST',
  'GENERAL',
]

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  BUG: 'Bug',
  RATING: 'Rating',
  FEATURE_REQUEST: 'Feature request',
  GENERAL: 'General',
}

export type FeedbackStatusFilter = FeedbackStatus | 'ALL'
export type FeedbackCategoryFilter = FeedbackCategory | 'ALL'

export type FeedbackRow = {
  id: string
  userId?: string | null
  email: string
  name?: string | null
  category: FeedbackCategory
  rating?: number | null
  message: string
  pageUrl?: string | null
  userAgent?: string | null
  status: FeedbackStatus
  ackEmailSentAt?: unknown
  createdAt: unknown
  updatedAt?: unknown
}

export type FeedbackApiPayload = {
  id: string
  userId?: string | null
  email: string
  name?: string | null
  category: FeedbackCategory
  rating?: number | null
  message: string
  pageUrl?: string | null
  path?: string | null
  userAgent?: string | null
  status: FeedbackStatus
  ackEmailSentAt?: unknown
  createdAt: unknown
  updatedAt?: unknown
}

export type FeedbackPage = {
  items: FeedbackRow[]
  nextCursor?: string | null
}

export type FeedbackSummary = {
  total: number
  open: number
  reviewed: number
  replied: number
  dismissed?: number | null
}

export type FeedbackDraftReply = {
  subject: string
  bodyText: string
  bodyHtml?: string | null
}

export type AdminFeedbacksVariables = {
  status?: FeedbackStatus
  category?: FeedbackCategory
  first: number
  after?: string
}

const OPEN_FIRST_RANK: Record<FeedbackStatus, number> = {
  OPEN: 0,
  REVIEWED: 1,
  REPLIED: 2,
  DISMISSED: 3,
}

export function parseFeedbackStatusFilter(
  value: string | null | undefined,
): FeedbackStatusFilter {
  if (
    value === 'OPEN' ||
    value === 'REVIEWED' ||
    value === 'REPLIED' ||
    value === 'DISMISSED'
  ) {
    return value
  }
  return 'ALL'
}

export function parseFeedbackCategoryFilter(
  value: string | null | undefined,
): FeedbackCategoryFilter {
  if (
    value === 'BUG' ||
    value === 'RATING' ||
    value === 'FEATURE_REQUEST' ||
    value === 'GENERAL'
  ) {
    return value
  }
  return 'ALL'
}

export function parseFeedbackId(
  value: string | null | undefined,
): string | null {
  const id = value?.trim()
  return id ? id : null
}

export function toAdminFeedbacksVariables(input: {
  status: FeedbackStatusFilter
  category: FeedbackCategoryFilter
  after?: string | null
  first?: number
}): AdminFeedbacksVariables {
  const vars: AdminFeedbacksVariables = {
    first: input.first ?? FEEDBACK_PAGE_SIZE,
  }
  if (input.status !== 'ALL') vars.status = input.status
  if (input.category !== 'ALL') vars.category = input.category
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
export function sortFeedbacksOpenFirst(items: FeedbackRow[]): FeedbackRow[] {
  return [...items].sort((a, b) => {
    const rank = OPEN_FIRST_RANK[a.status] - OPEN_FIRST_RANK[b.status]
    if (rank !== 0) return rank
    return createdAtMs(b.createdAt) - createdAtMs(a.createdAt)
  })
}

export function categoryLabel(category: FeedbackCategory): string {
  return FEEDBACK_CATEGORY_LABELS[category]
}

export function ratingLabel(rating: number | null | undefined): string {
  if (rating == null || rating < 1) return '—'
  return `${rating}/5`
}

export function feedbackPreview(
  message: string,
  max = FEEDBACK_PREVIEW_CHARS,
): string {
  const text = message.trim()
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trimEnd()}…`
}

export function submitterLabel(row: FeedbackRow): string {
  const name = row.name?.trim()
  if (name) return name
  const email = row.email?.trim()
  if (email) return email
  return row.userId?.trim() || 'Guest'
}

export function submitterHref(row: FeedbackRow): string | null {
  const id = row.userId?.trim()
  return id ? `/users/${id}` : null
}

export function feedbackFromApi(row: FeedbackApiPayload): FeedbackRow {
  const pageUrl = row.pageUrl?.trim() || row.path?.trim() || null
  return {
    id: row.id,
    userId: row.userId ?? null,
    email: row.email,
    name: row.name ?? null,
    category: row.category,
    rating: row.rating ?? null,
    message: row.message,
    pageUrl,
    userAgent: row.userAgent ?? null,
    status: row.status,
    ackEmailSentAt: row.ackEmailSentAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

/** Status mutations may return core fields only; keep list enrichment. */
export function mergeFeedbackRow(
  current: FeedbackRow,
  updated: FeedbackRow,
): FeedbackRow {
  return {
    ...current,
    ...updated,
    name: updated.name || current.name,
    email: updated.email || current.email,
    message: updated.message || current.message,
    pageUrl: updated.pageUrl || current.pageUrl,
    userAgent: updated.userAgent || current.userAgent,
    userId: updated.userId || current.userId,
    rating: updated.rating ?? current.rating,
  }
}

export function feedbackPath(input: {
  status?: FeedbackStatusFilter
  category?: FeedbackCategoryFilter
  id?: string | null
}): string {
  const params = new URLSearchParams()
  if (input.status && input.status !== 'ALL') params.set('status', input.status)
  if (input.category && input.category !== 'ALL') {
    params.set('category', input.category)
  }
  const id = input.id?.trim()
  if (id) params.set('id', id)
  const qs = params.toString()
  return qs ? `/feedback?${qs}` : '/feedback'
}

export function feedbackMailto(input: {
  to: string
  subject: string
  body: string
}): string {
  const params = new URLSearchParams()
  params.set('subject', input.subject)
  params.set('body', input.body)
  return `mailto:${input.to}?${params.toString().replace(/\+/g, '%20')}`
}

/** Optimistic count tweak after a status change. Total is unchanged. */
export function adjustFeedbackSummary(
  current: FeedbackSummary | null,
  previousStatus: FeedbackStatus | null | undefined,
  next: FeedbackStatus,
): FeedbackSummary | null {
  if (!current || !previousStatus || previousStatus === next) return current
  const nextSummary = { ...current }
  if (previousStatus === 'OPEN') nextSummary.open = Math.max(0, nextSummary.open - 1)
  if (previousStatus === 'REVIEWED') {
    nextSummary.reviewed = Math.max(0, nextSummary.reviewed - 1)
  }
  if (previousStatus === 'REPLIED') {
    nextSummary.replied = Math.max(0, nextSummary.replied - 1)
  }
  if (next === 'OPEN') nextSummary.open += 1
  if (next === 'REVIEWED') nextSummary.reviewed += 1
  if (next === 'REPLIED') nextSummary.replied += 1
  return nextSummary
}
