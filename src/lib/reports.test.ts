import { describe, expect, it } from 'vitest'

import {
  filterReportsByTargetType,
  mergeReportRow,
  parseReportStatusFilter,
  parseReportTargetTypeFilter,
  reporterHref,
  reporterLabel,
  reportFromApi,
  reportsPath,
  reportTargetHref,
  sortReportsOpenFirst,
  taskTitle,
  toAdminReportsVariables,
  type ReportRow,
} from './reports'

function report(partial: Partial<ReportRow> & Pick<ReportRow, 'id'>): ReportRow {
  return {
    targetId: 't1',
    targetType: 'TASK',
    reason: 'SPAM',
    status: 'OPEN',
    createdAt: '2026-09-14T12:00:00.000Z',
    reporterUserId: 'u1',
    ...partial,
  }
}

describe('parseReportStatusFilter', () => {
  it('defaults to all statuses', () => {
    expect(parseReportStatusFilter(null)).toBe('ALL')
    expect(parseReportStatusFilter('nope')).toBe('ALL')
  })

  it('accepts known statuses', () => {
    expect(parseReportStatusFilter('OPEN')).toBe('OPEN')
    expect(parseReportStatusFilter('DISMISSED')).toBe('DISMISSED')
  })
})

describe('parseReportTargetTypeFilter', () => {
  it('defaults to TASK for the ops inbox', () => {
    expect(parseReportTargetTypeFilter(null)).toBe('TASK')
    expect(parseReportTargetTypeFilter('nope')).toBe('TASK')
  })

  it('accepts all types and worker/user', () => {
    expect(parseReportTargetTypeFilter('ALL')).toBe('ALL')
    expect(parseReportTargetTypeFilter('WORKER')).toBe('WORKER')
  })
})

describe('toAdminReportsVariables', () => {
  it('omits status and sends TASK on the default inbox', () => {
    expect(
      toAdminReportsVariables({ status: 'ALL', targetType: 'TASK' }),
    ).toEqual({ first: 100, targetType: 'TASK' })
  })

  it('passes status and after when paging a filtered view', () => {
    expect(
      toAdminReportsVariables({
        status: 'OPEN',
        targetType: 'ALL',
        after: 'cursor-1',
        first: 50,
      }),
    ).toEqual({ first: 50, status: 'OPEN', after: 'cursor-1' })
  })
})

describe('sortReportsOpenFirst', () => {
  it('keeps OPEN reports first then newest within a status', () => {
    const rows = sortReportsOpenFirst([
      report({
        id: 'old-open',
        status: 'OPEN',
        createdAt: '2026-09-01T00:00:00.000Z',
      }),
      report({
        id: 'new-reviewed',
        status: 'REVIEWED',
        createdAt: '2026-09-14T00:00:00.000Z',
      }),
      report({
        id: 'new-open',
        status: 'OPEN',
        createdAt: '2026-09-13T00:00:00.000Z',
      }),
      report({
        id: 'dismissed',
        status: 'DISMISSED',
        createdAt: '2026-09-12T00:00:00.000Z',
      }),
    ])
    expect(rows.map((row) => row.id)).toEqual([
      'new-open',
      'old-open',
      'new-reviewed',
      'dismissed',
    ])
  })
})

describe('filterReportsByTargetType', () => {
  it('keeps TASK rows for the default inbox fallback', () => {
    const rows = filterReportsByTargetType(
      [
        report({ id: 't', targetType: 'TASK' }),
        report({ id: 'w', targetType: 'WORKER' }),
      ],
      'TASK',
    )
    expect(rows.map((row) => row.id)).toEqual(['t'])
  })
})

describe('report links and labels', () => {
  it('links tasks and users inside the admin panel', () => {
    expect(
      reportTargetHref(report({ id: '1', targetType: 'TASK', targetId: 'abc' })),
    ).toBe('/tasks/abc')
    expect(
      reportTargetHref(report({ id: '2', targetType: 'USER', targetId: 'u9' })),
    ).toBe('/users/u9')
    expect(
      reportTargetHref(report({ id: '3', targetType: 'WORKER', targetId: 'w1' })),
    ).toBeNull()
  })

  it('prefers reporter name then email then id', () => {
    expect(
      reporterLabel(
        report({
          id: '1',
          reporter: { id: 'u2', email: 'ops@x.com', profile: { name: 'Pat' } },
        }),
      ),
    ).toBe('Pat')
    expect(
      reporterLabel(
        report({
          id: '2',
          reporterUserId: 'u3',
          reporter: { id: 'u3', email: 'sam@x.com' },
        }),
      ),
    ).toBe('sam@x.com')
    expect(
      reporterLabel(
        report({
          id: '4',
          reporterUserId: 'u5',
          reporterEmail: 'lee@x.com',
        }),
      ),
    ).toBe('lee@x.com')
    expect(reporterLabel(report({ id: '3', reporterUserId: 'u4' }))).toBe('u4')
    expect(reporterHref(report({ id: '3', reporterUserId: 'u4' }))).toBe(
      '/users/u4',
    )
  })

  it('uses BE-46 targetLabel when present', () => {
    expect(
      taskTitle(
        report({ id: '1', targetType: 'TASK', targetLabel: 'Leaky tap' }),
      ),
    ).toBe('Leaky tap')
    expect(taskTitle(report({ id: '2', targetId: 'zzz' }))).toBe('Task zzz')
  })
})

describe('reportFromApi', () => {
  it('maps live targetLabel and reporterEmail onto the inbox row', () => {
    const row = reportFromApi({
      id: 'r1',
      targetId: 't9',
      targetType: 'TASK',
      reason: 'SPAM',
      status: 'OPEN',
      createdAt: '2026-09-14T12:00:00.000Z',
      reporterUserId: 'u1',
      targetLabel: 'Garden fence',
      reporterEmail: 'pat@x.com',
    })
    expect(row.targetLabel).toBe('Garden fence')
    expect(row.reporterEmail).toBe('pat@x.com')
    expect(taskTitle(row)).toBe('Garden fence')
    expect(reporterLabel(row)).toBe('pat@x.com')
  })

  it('maps the pre-BE-46 targetTitle alias onto targetLabel', () => {
    const row = reportFromApi({
      id: 'r2',
      targetId: 't2',
      targetType: 'TASK',
      reason: 'SCAM',
      status: 'OPEN',
      createdAt: '2026-09-14T12:00:00.000Z',
      reporterUserId: 'u1',
      targetTitle: 'Old title field',
    })
    expect(row.targetLabel).toBe('Old title field')
    expect(taskTitle(row)).toBe('Old title field')
  })
})

describe('mergeReportRow', () => {
  it('keeps task title and reporter after a core status update', () => {
    const current = report({
      id: 'r1',
      targetLabel: 'Leaky tap',
      reporterEmail: 'sam@x.com',
      reporter: { id: 'u3', email: 'sam@x.com', profile: { name: 'Sam' } },
    })
    const merged = mergeReportRow(
      current,
      report({ id: 'r1', status: 'REVIEWED' }),
    )
    expect(merged.status).toBe('REVIEWED')
    expect(merged.targetLabel).toBe('Leaky tap')
    expect(merged.reporterEmail).toBe('sam@x.com')
    expect(merged.reporter?.profile?.name).toBe('Sam')
  })
})

describe('reportsPath', () => {
  it('omits default TASK + all-status query params', () => {
    expect(reportsPath({})).toBe('/reports')
    expect(reportsPath({ status: 'ALL', targetType: 'TASK' })).toBe('/reports')
    expect(reportsPath({ status: 'OPEN', targetType: 'ALL' })).toBe(
      '/reports?status=OPEN&targetType=ALL',
    )
  })
})
