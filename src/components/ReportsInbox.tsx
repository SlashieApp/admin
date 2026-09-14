'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { formatWhen } from '@/lib/dossier'
import { graphqlErrorMessage } from '@/lib/graphqlErrors'
import {
  listAdminReports,
  updateAdminReportStatus,
} from '@/lib/reportInbox'
import {
  parseReportStatusFilter,
  parseReportTargetTypeFilter,
  REPORT_STATUSES,
  reporterHref,
  reporterLabel,
  reportsPath,
  reportTargetHref,
  sortReportsOpenFirst,
  taskTitle,
  type ReportRow,
  type ReportStatus,
  type ReportStatusFilter,
  type ReportTargetTypeFilter,
} from '@/lib/reports'

const STATUS_TABS: { value: ReportStatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'ACTIONED', label: 'Actioned' },
  { value: 'DISMISSED', label: 'Dismissed' },
]

const TYPE_TABS: { value: ReportTargetTypeFilter; label: string }[] = [
  { value: 'TASK', label: 'Tasks' },
  { value: 'WORKER', label: 'Workers' },
  { value: 'USER', label: 'Users' },
  { value: 'ALL', label: 'All types' },
]

export function ReportsInbox() {
  const params = useSearchParams()
  const status = parseReportStatusFilter(params.get('status'))
  const targetType = parseReportTargetTypeFilter(params.get('targetType'))
  return (
    <ReportsInboxPanel
      key={`${status}:${targetType}`}
      status={status}
      targetType={targetType}
    />
  )
}

function ReportsInboxPanel({
  status,
  targetType,
}: {
  status: ReportStatusFilter
  targetType: ReportTargetTypeFilter
}) {
  const [items, setItems] = useState<ReportRow[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [busy, setBusy] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setBusy(true)
      setError(null)
      setActionError(null)
      try {
        const result = await listAdminReports({ status, targetType })
        if (cancelled) return
        setItems(result.items)
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
  }, [status, targetType])

  async function loadMore() {
    if (!nextCursor) return
    setLoadingMore(true)
    setActionError(null)
    try {
      const result = await listAdminReports({
        status,
        targetType,
        after: nextCursor,
      })
      setItems((current) => {
        const merged = [...current, ...result.items]
        return status === 'ALL' ? sortReportsOpenFirst(merged) : merged
      })
      setNextCursor(result.nextCursor)
      if (result.banner) setBanner(result.banner)
    } catch (err) {
      setActionError(graphqlErrorMessage(err))
    } finally {
      setLoadingMore(false)
    }
  }

  async function onStatusChange(id: string, next: ReportStatus) {
    setUpdatingId(id)
    setActionError(null)
    try {
      const updated = await updateAdminReportStatus(id, next)
      setItems((current) =>
        current.map((row) =>
          row.id === id
            ? {
                ...row,
                ...updated,
                targetTitle: updated.targetTitle || row.targetTitle,
                reporter: updated.reporter || row.reporter,
              }
            : row,
        ),
      )
    } catch (err) {
      setActionError(graphqlErrorMessage(err))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <section className="stack">
      <div>
        <h1>Reports</h1>
        <p className="muted">
          All reported tasks for ops. Default view is every status,{' '}
          <strong>OPEN first</strong>, newest within each status. Filter to a
          status or include worker/user reports.
        </p>
      </div>

      <nav className="tabs wrap" aria-label="Report status">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={reportsPath({ status: tab.value, targetType })}
            className={status === tab.value ? 'tab is-active' : 'tab'}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <nav className="tabs wrap" aria-label="Report target type">
        {TYPE_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={reportsPath({ status, targetType: tab.value })}
            className={targetType === tab.value ? 'tab is-active' : 'tab'}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {banner ? <p className="banner banner-warn">{banner}</p> : null}
      {error ? <p className="banner banner-error">{error}</p> : null}
      {actionError ? <p className="banner banner-error">{actionError}</p> : null}

      {busy ? <p className="muted">Loading reports…</p> : null}

      {!busy && !error && items.length === 0 ? (
        <p className="muted">No reports in this view.</p>
      ) : null}

      <ul className="list">
        {items.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            updating={updatingId === report.id}
            onStatusChange={onStatusChange}
          />
        ))}
      </ul>

      {nextCursor ? (
        <p>
          <button
            type="button"
            className="btn"
            onClick={() => void loadMore()}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </p>
      ) : null}
    </section>
  )
}

function ReportCard({
  report,
  updating,
  onStatusChange,
}: {
  report: ReportRow
  updating: boolean
  onStatusChange: (id: string, status: ReportStatus) => Promise<void>
}) {
  const href = reportTargetHref(report)
  const reporter = reporterHref(report)
  const title = taskTitle(report)

  return (
    <li className="card card-pad report-card">
      <div className="card-top">
        <div className="stack-tight">
          {href ? (
            <Link href={href} className="inline-link">
              <strong>{title}</strong>
            </Link>
          ) : (
            <strong>{title}</strong>
          )}
          <p className="meta">
            {report.targetType} · {report.reason.replaceAll('_', ' ')}
            {report.targetUrl ? (
              <>
                {' · '}
                <a
                  className="inline-link"
                  href={report.targetUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  marketplace link
                </a>
              </>
            ) : null}
          </p>
        </div>
        <span className={statusPillClass(report.status)}>{report.status}</span>
      </div>

      {report.details ? <p className="clamp">{report.details}</p> : null}

      <p className="meta">
        Reporter{' '}
        {reporter ? (
          <Link href={reporter} className="inline-link">
            {reporterLabel(report)}
          </Link>
        ) : (
          reporterLabel(report)
        )}
        {' · '}
        {formatWhen(report.createdAt)}
      </p>

      <label className="field report-status">
        Status
        <select
          className="input"
          value={report.status}
          disabled={updating}
          aria-label={`Update status for report ${report.id}`}
          onChange={(event) =>
            void onStatusChange(report.id, event.target.value as ReportStatus)
          }
        >
          {REPORT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
    </li>
  )
}

function statusPillClass(status: ReportStatus): string {
  if (status === 'OPEN') return 'pill pill-warn'
  if (status === 'ACTIONED') return 'pill pill-ok'
  return 'pill'
}
