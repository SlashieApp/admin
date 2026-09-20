'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { DataTable, type DataColumn } from '@/components/DataTable'
import { FilterToolbar } from '@/components/FilterToolbar'
import { TablePager } from '@/components/TablePager'
import { formatWhen } from '@/lib/dossier'
import { graphqlErrorMessage } from '@/lib/graphqlErrors'
import { nextSort } from '@/lib/listParams'
import {
  listAdminReports,
  updateAdminReportStatus,
} from '@/lib/reportInbox'
import {
  mergeReportRow,
  parseReportListFilters,
  refineReports,
  reportFiltersFromForm,
  reporterHref,
  reporterLabel,
  reportPageLocalNotice,
  reportsPath,
  reportTargetHref,
  REPORT_REASONS,
  REPORT_STATUSES,
  REPORT_TARGET_TYPES,
  taskTitle,
  type ReportListFilters,
  type ReportRow,
  type ReportStatus,
} from '@/lib/reports'

export function ReportsInbox() {
  const params = useSearchParams()
  const filters = useMemo(() => parseReportListFilters(params), [params])
  return <ReportsPanel filters={filters} />
}

function ReportsPanel({ filters }: { filters: ReportListFilters }) {
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
          status: filters.status,
          targetType: filters.targetType,
          after: filters.after || null,
          first: filters.first,
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
  }, [filters.status, filters.targetType, filters.after, filters.first])

  function go(next: Partial<ReportListFilters>, keepAfter = false) {
    const merged = { ...filters, ...next }
    if (!keepAfter && next.after === undefined) merged.after = ''
    router.push(reportsPath(merged))
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

  const visible = refineReports(rows, filters)
  const localNotice = reportPageLocalNotice(filters)

  const columns: DataColumn<ReportRow>[] = [
    {
      key: 'target',
      header: 'Target',
      sortKey: 'target',
      render: (row) => {
        const href = reportTargetHref(row)
        return href ? (
          <Link href={href} className="table-link">
            {taskTitle(row)}
          </Link>
        ) : (
          <strong>{taskTitle(row)}</strong>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortKey: 'status',
      render: (row) => (
        <select
          className="input table-select"
          value={row.status}
          disabled={updatingId === row.id}
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
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortKey: 'type',
      render: (row) => row.targetType,
    },
    {
      key: 'reason',
      header: 'Reason',
      sortKey: 'reason',
      render: (row) => row.reason,
    },
    {
      key: 'reporter',
      header: 'Reporter',
      sortKey: 'reporter',
      render: (row) => {
        const href = reporterHref(row)
        return href ? (
          <Link href={href} className="inline-link">
            {reporterLabel(row)}
          </Link>
        ) : (
          reporterLabel(row)
        )
      },
    },
    {
      key: 'created',
      header: 'Created',
      sortKey: 'created',
      render: (row) => formatWhen(row.createdAt),
    },
  ]

  return (
    <section className="stack">
      <div className="page-intro">
        <h1>Reports</h1>
        <p className="muted">
          Ops inbox for reported marketplace content. Default view is task
          reports, all statuses, with open items first. Status and target type
          are server filters; reason, reporter, and date refine this page.
        </p>
      </div>

      <FilterToolbar
        key={reportsPath({ ...filters, after: '', sort: '', dir: 'desc' })}
        busy={busy}
        onSubmit={(event) => {
          event.preventDefault()
          setCursorStack([])
          go(reportFiltersFromForm(new FormData(event.currentTarget), filters))
        }}
        onClear={() => {
          setCursorStack([])
          router.push('/reports')
        }}
      >
        <label className="field">
          Status
          <select className="input" name="status" defaultValue={filters.status}>
            <option value="ALL">All statuses</option>
            {REPORT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Target
          <select
            className="input"
            name="targetType"
            defaultValue={filters.targetType}
          >
            {REPORT_TARGET_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
            <option value="ALL">All types</option>
          </select>
        </label>
        <label className="field">
          Reason
          <select className="input" name="reason" defaultValue={filters.reason}>
            <option value="ALL">All reasons</option>
            {REPORT_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Reporter
          <input
            className="input"
            name="reporter"
            defaultValue={filters.reporter}
            placeholder="Name, email, or id"
          />
        </label>
        <label className="field">
          From
          <input
            className="input"
            name="from"
            type="date"
            defaultValue={filters.from}
          />
        </label>
        <label className="field">
          To
          <input
            className="input"
            name="to"
            type="date"
            defaultValue={filters.to}
          />
        </label>
      </FilterToolbar>

      {banner ? <p className="banner banner-warn">{banner}</p> : null}
      {localNotice ? <p className="banner banner-warn">{localNotice}</p> : null}
      {error ? <p className="banner banner-error">{error}</p> : null}
      {updateError ? <p className="banner banner-error">{updateError}</p> : null}

      <DataTable
        rows={visible}
        columns={columns}
        rowKey={(row) => row.id}
        sort={filters.sort}
        dir={filters.dir}
        onSort={(key) => go(nextSort(filters.sort, filters.dir, key), true)}
        loading={busy}
        empty="No reports for this filter."
        renderCard={(row) => <ReportCard row={row} />}
        footer={
          <TablePager
            shown={visible.length}
            fetched={rows.length}
            pageSize={filters.first}
            hasNext={Boolean(nextCursor)}
            hasPrev={Boolean(filters.after)}
            onPageSize={(first) => {
              setCursorStack([])
              go({ first, after: '' })
            }}
            onNext={() => {
              if (!nextCursor) return
              setCursorStack((stack) => [...stack, filters.after])
              go({ after: nextCursor }, true)
            }}
            onPrev={() => {
              const prev = cursorStack.at(-1) ?? ''
              setCursorStack((stack) => stack.slice(0, -1))
              go({ after: prev }, true)
            }}
            onFirst={() => {
              setCursorStack([])
              go({ after: '' })
            }}
          />
        }
      />
    </section>
  )
}

function ReportCard({ row }: { row: ReportRow }) {
  const href = reportTargetHref(row)
  return (
    <>
      <div className="card-top">
        {href ? (
          <Link href={href} className="table-link">
            {taskTitle(row)}
          </Link>
        ) : (
          <strong>{taskTitle(row)}</strong>
        )}
        <span className={row.status === 'OPEN' ? 'pill pill-warn' : 'pill'}>
          {row.status}
        </span>
      </div>
      <p className="meta">
        {row.reason} · {row.targetType} · {reporterLabel(row)}
      </p>
      {row.details ? <p>{row.details}</p> : null}
    </>
  )
}
