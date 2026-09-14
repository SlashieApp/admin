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
  reporterHref,
  reporterLabel,
  reportsPath,
  reportTargetHref,
  REPORT_STATUSES,
  taskTitle,
  type ReportRow,
  type ReportStatus,
  type ReportStatusFilter,
  type ReportTargetTypeFilter,
} from '@/lib/reports'

const STATUS_FILTERS: { value: ReportStatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'ACTIONED', label: 'Actioned' },
  { value: 'DISMISSED', label: 'Dismissed' },
]

const TYPE_FILTERS: { value: ReportTargetTypeFilter; label: string }[] = [
  { value: 'TASK', label: 'Tasks' },
  { value: 'ALL', label: 'All types' },
  { value: 'WORKER', label: 'Workers' },
  { value: 'USER', label: 'Users' },
]

export function ReportsInbox() {
  const params = useSearchParams()
  const status = parseReportStatusFilter(params.get('status'))
  const targetType = parseReportTargetTypeFilter(params.get('targetType'))
  return <ReportsPanel key={`${status}:${targetType}`} status={status} targetType={targetType} />
}

function ReportsPanel({
  status,
  targetType,
}: {
  status: ReportStatusFilter
  targetType: ReportTargetTypeFilter
}) {
  const [rows, setRows] = useState<ReportRow[]>([])
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
        const result = await listAdminReports({ status, targetType })
        if (cancelled) return
        setRows(result.items)
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

  async function onStatusChange(id: string, next: ReportStatus) {
    setUpdatingId(id)
    setUpdateError(null)
    try {
      const updated = await updateAdminReportStatus(id, next)
      setRows((current) =>
        current.map((row) => (row.id === id ? { ...row, ...updated } : row)),
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
          reports, all statuses, with open items first.
        </p>
      </div>

      <div className="filter-block">
        <p className="filter-label" id="report-status-filter">
          Status
        </p>
        <nav className="tabs" aria-labelledby="report-status-filter">
          {STATUS_FILTERS.map((row) => (
            <Link
              key={row.value}
              href={reportsPath({ status: row.value, targetType })}
              className={status === row.value ? 'tab is-active' : 'tab'}
              aria-current={status === row.value ? 'page' : undefined}
            >
              {row.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="filter-block">
        <p className="filter-label" id="report-type-filter">
          Target type
        </p>
        <nav className="tabs" aria-labelledby="report-type-filter">
          {TYPE_FILTERS.map((row) => (
            <Link
              key={row.value}
              href={reportsPath({ status, targetType: row.value })}
              className={targetType === row.value ? 'tab is-active' : 'tab'}
              aria-current={targetType === row.value ? 'page' : undefined}
            >
              {row.label}
            </Link>
          ))}
        </nav>
      </div>

      {banner ? <p className="banner banner-warn">{banner}</p> : null}
      {error ? <p className="banner banner-error">{error}</p> : null}
      {updateError ? <p className="banner banner-error">{updateError}</p> : null}
      {busy ? <p className="muted">Loading reports…</p> : null}

      {!busy && !error && rows.length === 0 ? (
        <p className="muted">No reports for this filter.</p>
      ) : null}

      <ul className="list">
        {rows.map((row) => {
          const href = reportTargetHref(row)
          const reporter = reporterHref(row)
          const updating = updatingId === row.id
          return (
            <li key={row.id} className="card card-pad report-card">
              <div className="card-top">
                {href ? (
                  <Link href={href} className="inline-link">
                    {taskTitle(row)}
                  </Link>
                ) : (
                  <strong>{taskTitle(row)}</strong>
                )}
                <span className={row.status === 'OPEN' ? 'pill pill-warn' : 'pill'}>
                  {row.status}
                </span>
              </div>
              <dl className="kv report-kv">
                <div>
                  <dt>Reason</dt>
                  <dd>{row.reason}</dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>{row.targetType}</dd>
                </div>
                <div>
                  <dt>Reporter</dt>
                  <dd>
                    {reporter ? (
                      <Link href={reporter} className="inline-link">
                        {reporterLabel(row)}
                      </Link>
                    ) : (
                      reporterLabel(row)
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatWhen(row.createdAt)}</dd>
                </div>
              </dl>
              {row.targetUrl ? (
                <p className="meta">
                  Target URL:{' '}
                  <a
                    className="inline-link"
                    href={row.targetUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {row.targetUrl}
                  </a>
                </p>
              ) : null}
              {row.details ? <p>{row.details}</p> : null}
              <label className="field">
                Update status
                <select
                  className="input"
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
              </label>
              {updating ? <p className="meta">Saving…</p> : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
