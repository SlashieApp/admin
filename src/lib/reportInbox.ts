import {
  AdminReports,
  AdminReportsCore,
  AdminTasks,
  AdminUpdateReportStatus,
  AdminUpdateReportStatusCore,
  AdminUsers,
  Reports,
  TaskCore,
  UpdateReportStatus,
} from '@/graphql/operations'
import { apolloClient } from '@/lib/apollo'
import {
  graphqlErrorMessage,
  isForbiddenAdminError,
  isMissingAdminFieldError,
} from '@/lib/graphqlErrors'
import {
  filterReportsByTargetType,
  MAX_REPORT_PAGES,
  reportFromApi,
  sortReportsOpenFirst,
  toAdminReportsVariables,
  type ReportApiPayload,
  type ReportPage,
  type ReportRow,
  type ReportStatus,
  type ReportStatusFilter,
  type ReportTargetTypeFilter,
} from '@/lib/reports'
import type {
  AdminReportsCoreQuery,
  AdminReportsQuery,
  AdminTasksQuery,
  AdminUpdateReportStatusMutation,
  AdminUpdateReportStatusCoreMutation,
  AdminUsersQuery,
  ReportsQuery,
  TaskCoreQuery,
  UpdateReportStatusMutation,
} from '@codegen/schema'

export type ReportListSource = 'adminReports' | 'reports'

export type ReportListResult = {
  items: ReportRow[]
  nextCursor: string | null
  source: ReportListSource
  banner: string | null
}

type ReportPayload = ReportApiPayload

function asReportRow(row: ReportPayload): ReportRow {
  return reportFromApi(row)
}

async function queryAdminReportsRich(
  variables: ReturnType<typeof toAdminReportsVariables>,
): Promise<ReportPage> {
  const result = await apolloClient.query<AdminReportsQuery>({
    query: AdminReports,
    variables,
    fetchPolicy: 'network-only',
  })
  const page = result.data?.adminReports
  return {
    items: (page?.items ?? []).map(asReportRow),
    nextCursor: page?.nextCursor ?? null,
  }
}

async function queryAdminReportsCore(
  variables: ReturnType<typeof toAdminReportsVariables>,
): Promise<ReportPage> {
  const result = await apolloClient.query<AdminReportsCoreQuery>({
    query: AdminReportsCore,
    variables,
    fetchPolicy: 'network-only',
  })
  const page = result.data?.adminReports
  return {
    items: (page?.items ?? []).map(asReportRow),
    nextCursor: page?.nextCursor ?? null,
  }
}

async function queryReportsAllowlist(variables: {
  status?: ReportStatus
  first: number
  after?: string
}): Promise<ReportPage> {
  const result = await apolloClient.query<ReportsQuery>({
    query: Reports,
    variables,
    fetchPolicy: 'network-only',
  })
  const page = result.data?.reports
  return {
    items: (page?.items ?? []).map(asReportRow),
    nextCursor: page?.nextCursor ?? null,
  }
}

async function drainPages(
  fetchPage: (after?: string) => Promise<ReportPage>,
  after?: string | null,
): Promise<ReportPage> {
  const items: ReportRow[] = []
  let cursor = after ?? undefined
  let nextCursor: string | null = null

  for (let i = 0; i < MAX_REPORT_PAGES; i++) {
    const page = await fetchPage(cursor)
    items.push(...page.items)
    nextCursor = page.nextCursor ?? null
    if (!nextCursor) break
    cursor = nextCursor
  }

  return { items, nextCursor }
}

export async function listAdminReports(input: {
  status: ReportStatusFilter
  targetType: ReportTargetTypeFilter
  after?: string | null
}): Promise<ReportListResult> {
  const base = toAdminReportsVariables(input)

  try {
    const page = await drainPages(
      (after) => queryAdminReportsRich({ ...base, after }),
      input.after,
    )
    return {
      items: decorateList(page.items, input.status),
      nextCursor: page.nextCursor ?? null,
      source: 'adminReports',
      banner: null,
    }
  } catch (error) {
    if (!isMissingAdminFieldError(error)) throw error
  }

  try {
    const page = await drainPages(
      (after) => queryAdminReportsCore({ ...base, after }),
      input.after,
    )
    const enriched = await enrichReports(page.items)
    return {
      items: decorateList(enriched, input.status),
      nextCursor: page.nextCursor ?? null,
      source: 'adminReports',
      banner: null,
    }
  } catch (error) {
    if (!isMissingAdminFieldError(error)) throw error
  }

  try {
    const allowlistVars = {
      status: base.status,
      first: base.first,
      after: base.after,
    }
    const page = await drainPages(
      (after) => queryReportsAllowlist({ ...allowlistVars, after }),
      input.after,
    )
    const filtered = filterReportsByTargetType(page.items, input.targetType)
    const enriched = await enrichReports(filtered)
    return {
      items: decorateList(enriched, input.status),
      nextCursor: page.nextCursor ?? null,
      source: 'reports',
      banner:
        'adminReports is not on this Apollo yet (BE-46). Showing the BE-40 env-allowlist reports query instead.',
    }
  } catch (error) {
    if (isMissingAdminFieldError(error) || isForbiddenAdminError(error)) {
      throw new Error(
        'adminReports is not on this Apollo yet (BE-46), and the BE-40 reports query is unavailable (needs ADMIN_EMAILS or the new @admin field).',
      )
    }
    throw new Error(graphqlErrorMessage(error))
  }
}

function decorateList(
  items: ReportRow[],
  status: ReportStatusFilter,
): ReportRow[] {
  if (status === 'ALL') return sortReportsOpenFirst(items)
  return items
}

async function enrichReports(items: ReportRow[]): Promise<ReportRow[]> {
  const taskIds = [
    ...new Set(
      items
        .filter((row) => row.targetType === 'TASK' && !row.targetLabel)
        .map((row) => row.targetId),
    ),
  ]
  const reporterIds = [
    ...new Set(
      items.filter((row) => !row.reporter).map((row) => row.reporterUserId),
    ),
  ]

  const [titles, reporters] = await Promise.all([
    loadTaskTitles(taskIds),
    loadReporters(reporterIds),
  ])

  return items.map((row) => ({
    ...row,
    targetLabel:
      row.targetLabel ||
      (row.targetType === 'TASK' ? titles.get(row.targetId) : null) ||
      null,
    reporter: row.reporter || reporters.get(row.reporterUserId) || null,
    reporterEmail:
      row.reporterEmail ||
      reporters.get(row.reporterUserId)?.email ||
      null,
  }))
}

async function loadTaskTitles(ids: string[]): Promise<Map<string, string>> {
  const titles = new Map<string, string>()
  await Promise.all(
    ids.map(async (id) => {
      try {
        const result = await apolloClient.query<AdminTasksQuery>({
          query: AdminTasks,
          variables: { filter: { id }, first: 1 },
          fetchPolicy: 'network-only',
        })
        const title = result.data?.adminTasks?.[0]?.title?.trim()
        if (title) titles.set(id, title)
      } catch (error) {
        if (!isMissingAdminFieldError(error)) return
        try {
          const result = await apolloClient.query<TaskCoreQuery>({
            query: TaskCore,
            variables: { id },
            fetchPolicy: 'network-only',
          })
          const title = result.data?.task?.title?.trim()
          if (title) titles.set(id, title)
        } catch {
          // Enrichment is best-effort.
        }
      }
    }),
  )
  return titles
}

async function loadReporters(
  ids: string[],
): Promise<Map<string, NonNullable<ReportRow['reporter']>>> {
  const reporters = new Map<string, NonNullable<ReportRow['reporter']>>()
  await Promise.all(
    ids.map(async (id) => {
      try {
        const result = await apolloClient.query<AdminUsersQuery>({
          query: AdminUsers,
          variables: { id, first: 1 },
          fetchPolicy: 'network-only',
        })
        const user = result.data?.adminUsers?.[0]
        if (user) {
          reporters.set(id, {
            id: user.id,
            email: user.email,
            profile: user.profile ? { name: user.profile.name } : null,
          })
        }
      } catch {
        // Enrichment is best-effort.
      }
    }),
  )
  return reporters
}

export async function updateAdminReportStatus(
  id: string,
  status: ReportStatus,
): Promise<ReportRow> {
  try {
    const result = await apolloClient.mutate<AdminUpdateReportStatusMutation>({
      mutation: AdminUpdateReportStatus,
      variables: { id, status },
    })
    const updated = result.data?.adminUpdateReportStatus
    if (!updated) throw new Error('adminUpdateReportStatus returned no report')
    return asReportRow(updated)
  } catch (error) {
    if (!isMissingAdminFieldError(error)) throw error
  }

  try {
    const result =
      await apolloClient.mutate<AdminUpdateReportStatusCoreMutation>({
        mutation: AdminUpdateReportStatusCore,
        variables: { id, status },
      })
    const updated = result.data?.adminUpdateReportStatus
    if (!updated) throw new Error('adminUpdateReportStatus returned no report')
    return asReportRow(updated)
  } catch (error) {
    if (!isMissingAdminFieldError(error)) throw error
  }

  try {
    const result = await apolloClient.mutate<UpdateReportStatusMutation>({
      mutation: UpdateReportStatus,
      variables: { id, status },
    })
    const updated = result.data?.updateReportStatus
    if (!updated) throw new Error('updateReportStatus returned no report')
    return asReportRow(updated)
  } catch (error) {
    if (isMissingAdminFieldError(error)) {
      throw new Error(
        'adminUpdateReportStatus is not on this Apollo yet (BE-46), and BE-40 updateReportStatus is unavailable.',
      )
    }
    throw error
  }
}
