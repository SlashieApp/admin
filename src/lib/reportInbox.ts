import { AdminReports, AdminUpdateReportStatus } from '@/graphql/operations'
import { apolloClient } from '@/lib/apollo'
import {
  sortReportsOpenFirst,
  toAdminReportsVariables,
  type ReportPage,
  type ReportRow,
  type ReportStatus,
  type ReportStatusFilter,
  type ReportTargetTypeFilter,
} from '@/lib/reports'
import type {
  AdminReportsQuery,
  AdminUpdateReportStatusMutation,
} from '@codegen/schema'

export async function listAdminReports(input: {
  status: ReportStatusFilter
  targetType: ReportTargetTypeFilter
  after?: string | null
  first?: number
}): Promise<ReportPage> {
  const result = await apolloClient.query<AdminReportsQuery>({
    query: AdminReports,
    variables: toAdminReportsVariables(input),
    fetchPolicy: 'network-only',
  })
  const page = result.data?.adminReports
  const items = page?.items ?? []
  return {
    items: input.status === 'ALL' ? sortReportsOpenFirst(items) : items,
    nextCursor: page?.nextCursor ?? null,
  }
}

export async function updateAdminReportStatus(
  id: string,
  status: ReportStatus,
): Promise<ReportRow> {
  const result = await apolloClient.mutate<AdminUpdateReportStatusMutation>({
    mutation: AdminUpdateReportStatus,
    variables: { id, status },
  })
  const updated = result.data?.adminUpdateReportStatus
  if (!updated) throw new Error('adminUpdateReportStatus returned no report')
  return updated
}
