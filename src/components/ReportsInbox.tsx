'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { DataTable } from '@/components/ops/DataTable'
import { DraftFilters, FilterField, FilterToolbar } from '@/components/ops/FilterToolbar'
import { PaginationBar } from '@/components/ops/PaginationBar'
import { formatWhen } from '@/lib/dossier'
import { graphqlErrorMessage } from '@/lib/graphqlErrors'
import {
  parseCursor,
  parseIsoDate,
  parsePageSize,
  parseSortDir,
  sortBy,
  type PageSize,
  type SortDir,
} from '@/lib/listQuery'
import {
  listAdminReports,
  updateAdminReportStatus,
} from '@/lib/reportInbox'
import {
  applyReportClientFilters,
  mergeReportRow,
  parseReportQuery,
  parseReportReasonFilter,
  parseReportStatusFilter,
  parseReportTargetTypeFilter,
  reportClientFilterActive,
  reporterHref,
  reporterLabel,
  reportsPath,
  reportTargetHref,
  sortReportsOpenFirst,
  REPORT_REASONS,
  REPORT_STATUSES,
  REPORT_TARGET_TYPES,
  taskTitle,
  type ReportReasonFilter,
  type ReportRow,
  type ReportStatus,
  type ReportStatusFilter,
  type ReportTargetTypeFilter,
} from '@/lib/reports'

type ReportsView = {
  status: ReportStatusFilter
  targetType: ReportTargetTypeFilter
  reason: ReportReasonFilter
  reporter: string
  from: string
  to: string
  after: string | null
  first: PageSize
  sort: string
  dir: SortDir
}

const REPORT_COLUMNS = [
  { key: 'target', label: 'Target', sortKey: 'target' },
  { key: 'type', label: 'Type', sortKey: 'type' },
  { key: 'reason', label: 'Reason', sortKey: 'reason' },
  { key: 'reporter', label: 'Reporter', sortKey: 'reporter' },
  { key: 'status', label: 'Status', sortKey: 'status' },
  { key: 'createdAt', label: 'Created', sortKey: 'createdAt' },
  { key: 'details', label: 'Details' },
  { key: 'actions', label: 'Update' },
]

const CLIENT_FILTER_NOTE =
  'Reason, reporter, and date filter this API page only. adminReports paginates with first/after and filters status + targetType.'

function parseReportsView(params: Pick<URLSearchParams, 'get'>): ReportsView {
  const sort = params.get('sort')?.trim() ?? ''
  return {
    status: parseReportStatusFilter(params.get('status')),
    targetType: parseReportTargetTypeFilter(params.get('targetType')),
    reason: parseReportReasonFilter(params.get('reason')),
    reporter: parseReportQuery(params.get('reporter')),
    from: parseIsoDate(params.get('from')),
    to: parseIsoDate(params.get('to')),
    after: parseCursor(params.get('after')),
    first: parsePageSize(params.get('first'), 50),
    sort: ['target', 'type', 'reason', 'reporter', 'status', 'createdAt'].includes(
      sort,
    )
      ? sort
      : 'createdAt',
    dir: parseSortDir(params.get('dir') ?? 'desc'),
  }
}

export function ReportsInbox() {
  const params = useSearchParams()
  const view = useMemo(() => parseReportsView(params), [params])
  return (
    <ReportsPanel
      key={`${view.status}:${view.targetType}:${view.first}`}
      view={view}
    />
  )
}

function ReportsPanel({ view }: { view: ReportsView }) {
  const router = useRouter()
  const [rows, setRows] = useState<ReportRow[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [cursorStack, setCursorStack] = useState<string[]>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setBusy(true)
      setError(null)
      setBanner(null)
      try {
        const result = await listAdminReports({
          status: view.status,
          targetType: view.targetType,
          after: view.after,
          first: view.first,
        })
        if (cancelled) return
        setRows(result.items)
        setNextCursor(result.nextCursor)
        setBanner(result.banner)
      } catch (err) {
        if (!cancelled) setError(graphqlErrorMessage(err))
      } finally {
        if (!cancelled) setBusy(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [view.status, view.targetType, view.after, view.first])

  const visible = useMemo(() => {
    const filtered = applyReportClientFilters(rows, view)
    const base =
      view.status === 'ALL' ? sortReportsOpenFirst(filtered) : filtered
    if (view.sort === 'createdAt' && view.status === 'ALL') return base
    return sortBy(base, view.dir, (row) => {
      switch (view.sort) {
        case 'target':
          return taskTitle(row)
        case 'type':
          return row.targetType
        case 'reason':
          return row.reason
        case 'reporter':
          return reporterLabel(row)
        case 'status':
          return row.status
        default:
          return String(row.createdAt ?? '')
      }
    })
  }, [rows, view])

  function go(next: ReportsView, replaceStack = false) {
    if (replaceStack) setCursorStack([])
    router.replace(
      reportsPath({
        status: next.status,
        targetType: next.targetType,
        reason: next.reason,
        reporter: next.reporter,
        from: next.from,
        to: next.to,
        after: next.after,
        first: next.first,
        sort: next.sort,
        dir: next.dir,
      }),
    )
  }

  async function onStatusChange(id: string, next: ReportStatus) {
    setUpdatingId(id)
    setUpdateError(null)
    try {
      const updated = await updateAdminReportStatus(id, next)
      setRows((current) =>
        current.map((row) =>
          row.id === id ? mergeReportRow(row, updated) : row,
        ),
      )
    } catch (err) {
      setUpdateError(graphqlErrorMessage(err))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <section className="stack">
      <div className="page-intro">
        <h1>Reports</h1>
        <p className="muted">
          Ops inbox for reported marketplace content. Default view is task
          reports, all statuses, with open items first on the current page.
        </p>
      </div>

      <DraftFilters key={reportsPath({ ...view, after: null })} value={view}>
        {(draft, setDraft) => (
      <FilterToolbar
        onSubmit={(event) => {
          event.preventDefault()
          go({ ...draft, after: null }, true)
        }}
        onClearHref="/reports"
        busy={busy}
        note={CLIENT_FILTER_NOTE}
      >
        <FilterField label="Status">
          <select
            className="input"
            value={draft.status}
            onChange={(e) =>
              setDraft({
                ...draft,
                status: parseReportStatusFilter(e.target.value),
              })
            }
          >
            <option value="ALL">All statuses</option>
            {REPORT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Target">
          <select
            className="input"
            value={draft.targetType}
            onChange={(e) =>
              setDraft({
                ...draft,
                targetType: parseReportTargetTypeFilter(e.target.value),
              })
            }
          >
            {REPORT_TARGET_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
            <option value="ALL">ALL</option>
          </select>
        </FilterField>
        <FilterField label="Reason">
          <select
            className="input"
            value={draft.reason}
            onChange={(e) =>
              setDraft({
                ...draft,
                reason: parseReportReasonFilter(e.target.value),
              })
            }
          >
            <option value="ALL">All reasons</option>
            {REPORT_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Reporter">
          <input
            className="input"
            value={draft.reporter}
            onChange={(e) => setDraft({ ...draft, reporter: e.target.value })}
            placeholder="Name, email, or id"
          />
        </FilterField>
        <FilterField label="From">
          <input
            className="input"
            type="date"
            value={draft.from}
            onChange={(e) => setDraft({ ...draft, from: e.target.value })}
          />
        </FilterField>
        <FilterField label="To">
          <input
            className="input"
            type="date"
            value={draft.to}
            onChange={(e) => setDraft({ ...draft, to: e.target.value })}
          />
        </FilterField>
      </FilterToolbar>
        )}
      </DraftFilters>

      {banner ? <p className="banner banner-warn">{banner}</p> : null}
      {error ? <p className="banner banner-error">{error}</p> : null}
      {updateError ? <p className="banner banner-error">{updateError}</p> : null}
      {busy ? <p className="muted">Loading reports…</p> : null}

      {!busy && !error ? (
        <DataTable
          caption="Reports"
          columns={REPORT_COLUMNS}
          rows={visible}
          sort={view.sort}
          dir={view.dir}
          onSort={(sort, dir) => go({ ...view, sort, dir })}
          empty="No reports for this filter."
          render={(row, key) => {
            if (key === 'target') {
              const href = reportTargetHref(row)
              return href ? (
                <Link href={href} className="table-link">
                  {taskTitle(row)}
                </Link>
              ) : (
                <strong>{taskTitle(row)}</strong>
              )
            }
            if (key === 'type') return row.targetType
            if (key === 'reason') return row.reason
            if (key === 'reporter') {
              const reporter = reporterHref(row)
              return reporter ? (
                <Link href={reporter} className="inline-link">
                  {reporterLabel(row)}
                </Link>
              ) : (
                reporterLabel(row)
              )
            }
            if (key === 'status') {
              return (
                <span className={row.status === 'OPEN' ? 'pill pill-warn' : 'pill'}>
                  {row.status}
                </span>
              )
            }
            if (key === 'createdAt') return formatWhen(row.createdAt)
            if (key === 'details') return row.details || '—'
            const updating = updatingId === row.id
            return (
              <select
                className="input table-select"
                value={row.status}
                disabled={updating}
                aria-label={`Update status for ${taskTitle(row)}`}
                onChange={(event) =>
                  void onStatusChange(row.id, event.target.value as ReportStatus)
                }
              >
                {REPORT_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            )
          }}
        />
      ) : null}

      <PaginationBar
        shownCount={visible.length}
        fetchedCount={rows.length}
        pageSize={view.first}
        filtered={reportClientFilterActive(view)}
        onPageSize={(first: PageSize) => go({ ...view, first, after: null }, true)}
        canPrev={Boolean(view.after)}
        canNext={Boolean(nextCursor)}
        onPrev={() => {
          const prev = cursorStack[cursorStack.length - 1]
          setCursorStack((stack) => stack.slice(0, -1))
          go({ ...view, after: prev || null })
        }}
        onNext={() => {
          if (!nextCursor) return
          setCursorStack((stack) => [...stack, view.after ?? ''])
          go({ ...view, after: nextCursor })
        }}
      />
    </section>
  )
}
