import 'server-only'

import { hogqlString } from '@/lib/hogql'
import type { AdminOpsRange } from '@/lib/opsRange'
import { rangeToHogqlWhere } from '@/lib/opsRange'
import { DASHBOARD_PRODUCT_EVENTS } from '@/lib/posthogEvents'

export type PosthogEnv = {
  host: string
  projectId: string
  apiKey: string
}

export function getPosthogEnv(): PosthogEnv | null {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY?.trim()
  const projectId = process.env.POSTHOG_PROJECT_ID?.trim()
  if (!apiKey || !projectId) return null
  const host = (
    process.env.POSTHOG_HOST?.trim() ||
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() ||
    'https://eu.posthog.com'
  ).replace(/\/$/, '')
  return { host, projectId, apiKey }
}

export function isPosthogConfigured(): boolean {
  return getPosthogEnv() !== null
}

type HogqlResponse = {
  columns?: string[]
  results?: unknown[]
}

export async function runHogql(
  query: string,
  name: string,
): Promise<{ columns: string[]; rows: unknown[][] }> {
  const env = getPosthogEnv()
  if (!env) throw new Error('PostHog is not configured')

  const response = await fetch(
    `${env.host}/api/projects/${env.projectId}/query/`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${env.apiKey}`,
      },
      body: JSON.stringify({
        query: { kind: 'HogQLQuery', query },
        name,
      }),
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    throw new Error(`PostHog query failed (${response.status})`)
  }

  const payload = (await response.json()) as HogqlResponse & {
    results?: unknown
  }
  const nested = payload as {
    results?: { columns?: string[]; results?: unknown[] } | unknown[]
    columns?: string[]
  }
  const columns =
    nested.columns ??
    (nested.results &&
    typeof nested.results === 'object' &&
    !Array.isArray(nested.results)
      ? nested.results.columns
      : undefined) ??
    []
  const rawRows = Array.isArray(nested.results)
    ? nested.results
    : nested.results &&
        typeof nested.results === 'object' &&
        Array.isArray(nested.results.results)
      ? nested.results.results
      : []
  return {
    columns,
    rows: rawRows as unknown[][],
  }
}

export type ProductMetricRow = {
  event: string
  count: number
  users: number
}

export type ProductDayRow = {
  day: string
  users: number
}

export type ProductDashboardMetrics = {
  configured: boolean
  error?: string
  totals: ProductMetricRow[]
  dau: ProductDayRow[]
}

export async function fetchDashboardProductMetrics(
  range: AdminOpsRange,
): Promise<ProductDashboardMetrics> {
  if (!isPosthogConfigured()) {
    return { configured: false, totals: [], dau: [] }
  }

  const events = DASHBOARD_PRODUCT_EVENTS.map((row) => hogqlString(row.event)).join(
    ', ',
  )
  const where = rangeToHogqlWhere(range)

  try {
    const [totals, dau] = await Promise.all([
      runHogql(
        `SELECT event, count() AS n, count(DISTINCT distinct_id) AS users
         FROM events
         WHERE ${where}
           AND event IN (${events})
         GROUP BY event
         ORDER BY n DESC`,
        'admin-dashboard-event-totals',
      ),
      runHogql(
        `SELECT toDate(timestamp) AS day, count(DISTINCT distinct_id) AS users
         FROM events
         WHERE ${where}
           AND event = '$pageview'
         GROUP BY day
         ORDER BY day ASC`,
        'admin-dashboard-dau',
      ),
    ])

    return {
      configured: true,
      totals: totals.rows.map((row) => ({
        event: String(row[0] ?? ''),
        count: Number(row[1] ?? 0),
        users: Number(row[2] ?? 0),
      })),
      dau: dau.rows.map((row) => ({
        day: String(row[0] ?? ''),
        users: Number(row[1] ?? 0),
      })),
    }
  } catch (error) {
    return {
      configured: true,
      error: error instanceof Error ? error.message : 'PostHog query failed',
      totals: [],
      dau: [],
    }
  }
}

export type AnalyticsEventRow = {
  timestamp: string
  event: string
  distinctId: string
}

export type PersonAnalytics = {
  configured: boolean
  error?: string
  events: AnalyticsEventRow[]
  counts: ProductMetricRow[]
}

export async function fetchPersonAnalytics(input: {
  userId: string
  email?: string | null
}): Promise<PersonAnalytics> {
  if (!isPosthogConfigured()) {
    return { configured: false, events: [], counts: [] }
  }

  const clauses = [`distinct_id = ${hogqlString(input.userId)}`]
  if (input.email?.trim()) {
    const email = hogqlString(input.email.trim())
    clauses.push(`distinct_id = ${email}`)
    clauses.push(`person.properties.email = ${email}`)
  }

  try {
    const [events, counts] = await Promise.all([
      runHogql(
        `SELECT timestamp, event, distinct_id
         FROM events
         WHERE timestamp >= now() - INTERVAL 30 DAY
           AND (${clauses.join(' OR ')})
         ORDER BY timestamp DESC
         LIMIT 40`,
        'admin-user-recent-events',
      ),
      runHogql(
        `SELECT event, count() AS n, count(DISTINCT distinct_id) AS users
         FROM events
         WHERE timestamp >= now() - INTERVAL 30 DAY
           AND (${clauses.join(' OR ')})
         GROUP BY event
         ORDER BY n DESC
         LIMIT 20`,
        'admin-user-event-counts',
      ),
    ])
    return {
      configured: true,
      events: events.rows.map((row) => ({
        timestamp: String(row[0] ?? ''),
        event: String(row[1] ?? ''),
        distinctId: String(row[2] ?? ''),
      })),
      counts: counts.rows.map((row) => ({
        event: String(row[0] ?? ''),
        count: Number(row[1] ?? 0),
        users: Number(row[2] ?? 0),
      })),
    }
  } catch (error) {
    return {
      configured: true,
      error: error instanceof Error ? error.message : 'PostHog query failed',
      events: [],
      counts: [],
    }
  }
}

export async function fetchTaskAnalytics(taskId: string): Promise<PersonAnalytics> {
  if (!isPosthogConfigured()) {
    return { configured: false, events: [], counts: [] }
  }

  const id = hogqlString(taskId)
  const match = `(toString(properties.task_id) = ${id} OR toString(properties.taskId) = ${id})`

  try {
    const [events, counts] = await Promise.all([
      runHogql(
        `SELECT timestamp, event, distinct_id
         FROM events
         WHERE timestamp >= now() - INTERVAL 30 DAY
           AND ${match}
         ORDER BY timestamp DESC
         LIMIT 40`,
        'admin-task-recent-events',
      ),
      runHogql(
        `SELECT event, count() AS n, count(DISTINCT distinct_id) AS users
         FROM events
         WHERE timestamp >= now() - INTERVAL 30 DAY
           AND ${match}
         GROUP BY event
         ORDER BY n DESC
         LIMIT 20`,
        'admin-task-event-counts',
      ),
    ])
    return {
      configured: true,
      events: events.rows.map((row) => ({
        timestamp: String(row[0] ?? ''),
        event: String(row[1] ?? ''),
        distinctId: String(row[2] ?? ''),
      })),
      counts: counts.rows.map((row) => ({
        event: String(row[0] ?? ''),
        count: Number(row[1] ?? 0),
        users: Number(row[2] ?? 0),
      })),
    }
  } catch (error) {
    return {
      configured: true,
      error: error instanceof Error ? error.message : 'PostHog query failed',
      events: [],
      counts: [],
    }
  }
}
