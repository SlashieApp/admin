'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { formatWhen } from '@/lib/dossier'
import {
  adjustFeedbackSummary,
  categoryLabel,
  feedbackMailto,
  feedbackPath,
  feedbackPreview,
  mergeFeedbackRow,
  parseFeedbackCategoryFilter,
  parseFeedbackId,
  parseFeedbackStatusFilter,
  ratingLabel,
  submitterHref,
  submitterLabel,
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUSES,
  type FeedbackCategoryFilter,
  type FeedbackDraftReply,
  type FeedbackRow,
  type FeedbackStatus,
  type FeedbackStatusFilter,
  type FeedbackSummary,
} from '@/lib/feedback'
import {
  listAdminFeedbacks,
  loadFeedbackDraftReply,
  loadFeedbackSummary,
  updateAdminFeedbackStatus,
} from '@/lib/feedbackInbox'
import { graphqlErrorMessage } from '@/lib/graphqlErrors'

const STATUS_FILTERS: { value: FeedbackStatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'REPLIED', label: 'Replied' },
  { value: 'DISMISSED', label: 'Dismissed' },
]

const CATEGORY_FILTERS: { value: FeedbackCategoryFilter; label: string }[] = [
  { value: 'ALL', label: 'All categories' },
  ...FEEDBACK_CATEGORIES.map((value) => ({
    value,
    label: categoryLabel(value),
  })),
]

export function FeedbackInbox() {
  const params = useSearchParams()
  const status = parseFeedbackStatusFilter(params.get('status'))
  const category = parseFeedbackCategoryFilter(params.get('category'))
  const selectedId = parseFeedbackId(params.get('id'))
  return (
    <FeedbackPanel
      key={`${status}:${category}`}
      status={status}
      category={category}
      selectedId={selectedId}
    />
  )
}

function FeedbackPanel({
  status,
  category,
  selectedId,
}: {
  status: FeedbackStatusFilter
  category: FeedbackCategoryFilter
  selectedId: string | null
}) {
  const [rows, setRows] = useState<FeedbackRow[]>([])
  const [summary, setSummary] = useState<FeedbackSummary | null>(null)
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
        const [list, counts] = await Promise.all([
          listAdminFeedbacks({ status, category }),
          loadFeedbackSummary().catch(() => null),
        ])
        if (cancelled) return
        setRows(list.items)
        setBanner(list.banner)
        setSummary(counts)
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
  }, [status, category])

  async function onStatusChange(id: string, next: FeedbackStatus) {
    setUpdatingId(id)
    setUpdateError(null)
    try {
      const updated = await updateAdminFeedbackStatus(id, next)
      setRows((current) =>
        current.map((row) =>
          row.id === id ? mergeFeedbackRow(row, updated) : row,
        ),
      )
      setSummary((current) =>
        adjustFeedbackSummary(
          current,
          rows.find((row) => row.id === id)?.status,
          next,
        ),
      )
    } catch (err) {
      setUpdateError(graphqlErrorMessage(err))
    } finally {
      setUpdatingId(null)
    }
  }

  const selected = selectedId
    ? (rows.find((row) => row.id === selectedId) ?? null)
    : null

  return (
    <section className="stack">
      <div className="page-intro">
        <h1>Feedback</h1>
        <p className="muted">
          Product feedback inbox (bugs, ratings, feature requests, comments).
          Separate from the{' '}
          <Link href="/reports" className="inline-link">
            Reports
          </Link>{' '}
          trust-and-safety queue. Draft replies are for a human to send — this
          panel does not email the submitter.
        </p>
      </div>

      <dl className="kpi-grid feedback-kpis" aria-label="Feedback counts">
        <SummaryMetric
          label="Total"
          value={summary?.total}
          href={feedbackPath({ category })}
          active={status === 'ALL'}
        />
        <SummaryMetric
          label="Open"
          value={summary?.open}
          href={feedbackPath({ status: 'OPEN', category })}
          active={status === 'OPEN'}
        />
        <SummaryMetric
          label="Reviewed"
          value={summary?.reviewed}
          href={feedbackPath({ status: 'REVIEWED', category })}
          active={status === 'REVIEWED'}
        />
        <SummaryMetric
          label="Replied"
          value={summary?.replied}
          href={feedbackPath({ status: 'REPLIED', category })}
          active={status === 'REPLIED'}
        />
      </dl>

      <div className="filter-block">
        <p className="filter-label" id="feedback-status-filter">
          Status
        </p>
        <nav className="tabs" aria-labelledby="feedback-status-filter">
          {STATUS_FILTERS.map((row) => (
            <Link
              key={row.value}
              href={feedbackPath({ status: row.value, category })}
              className={status === row.value ? 'tab is-active' : 'tab'}
              aria-current={status === row.value ? 'page' : undefined}
            >
              {row.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="filter-block">
        <p className="filter-label" id="feedback-category-filter">
          Category
        </p>
        <nav className="tabs" aria-labelledby="feedback-category-filter">
          {CATEGORY_FILTERS.map((row) => (
            <Link
              key={row.value}
              href={feedbackPath({ status, category: row.value })}
              className={category === row.value ? 'tab is-active' : 'tab'}
              aria-current={category === row.value ? 'page' : undefined}
            >
              {row.label}
            </Link>
          ))}
        </nav>
      </div>

      {banner ? <p className="banner banner-warn">{banner}</p> : null}
      {error ? <p className="banner banner-error">{error}</p> : null}
      {updateError ? <p className="banner banner-error">{updateError}</p> : null}
      {busy ? <p className="muted">Loading feedback…</p> : null}

      {!busy && !error && rows.length === 0 ? (
        <p className="muted">No feedback for this filter.</p>
      ) : null}

      <div className="layout-split">
        <ul className="list">
          {rows.map((row) => {
            const href = submitterHref(row)
            const updating = updatingId === row.id
            const isSelected = selectedId === row.id
            return (
              <li
                key={row.id}
                className={
                  isSelected
                    ? 'card card-pad report-card is-selected'
                    : 'card card-pad report-card'
                }
              >
                <div className="card-top">
                  <Link
                    href={feedbackPath({ status, category, id: row.id })}
                    className="inline-link"
                    aria-current={isSelected ? 'page' : undefined}
                  >
                    {submitterLabel(row)}
                  </Link>
                  <span
                    className={
                      row.status === 'OPEN'
                        ? 'pill pill-warn'
                        : row.status === 'REPLIED'
                          ? 'pill pill-ok'
                          : 'pill'
                    }
                  >
                    {row.status}
                  </span>
                </div>
                <dl className="kv report-kv">
                  <div>
                    <dt>Category</dt>
                    <dd>{categoryLabel(row.category)}</dd>
                  </div>
                  <div>
                    <dt>Rating</dt>
                    <dd>{ratingLabel(row.rating)}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>
                      {href ? (
                        <Link href={href} className="inline-link">
                          {row.email}
                        </Link>
                      ) : (
                        row.email
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>{formatWhen(row.createdAt)}</dd>
                  </div>
                </dl>
                {row.pageUrl ? (
                  <p className="meta">
                    Page:{' '}
                    <PageLink href={row.pageUrl} />
                  </p>
                ) : null}
                <p>{feedbackPreview(row.message)}</p>
                <label className="field">
                  Update status
                  <select
                    className="input"
                    value={row.status}
                    disabled={updating}
                    aria-label={`Update status for ${submitterLabel(row)}`}
                    onChange={(event) =>
                      void onStatusChange(
                        row.id,
                        event.target.value as FeedbackStatus,
                      )
                    }
                  >
                    {FEEDBACK_STATUSES.map((value) => (
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

        <FeedbackDetail
          row={selected}
          status={status}
          category={category}
          updating={selected ? updatingId === selected.id : false}
          onStatusChange={onStatusChange}
        />
      </div>
    </section>
  )
}

function FeedbackDetail({
  row,
  status,
  category,
  updating,
  onStatusChange,
}: {
  row: FeedbackRow | null
  status: FeedbackStatusFilter
  category: FeedbackCategoryFilter
  updating: boolean
  onStatusChange: (id: string, next: FeedbackStatus) => Promise<void>
}) {
  if (!row) {
    return (
      <aside className="section sticky-detail">
        <h2>Detail + draft reply</h2>
        <p className="muted">
          Select a submission to see the full record and a templated reply.
          This is product feedback, not a Reports abuse item.
        </p>
      </aside>
    )
  }

  const href = submitterHref(row)

  return (
    <aside className="section sticky-detail">
      <div className="card-top">
        <h2>{submitterLabel(row)}</h2>
        <span
          className={
            row.status === 'OPEN'
              ? 'pill pill-warn'
              : row.status === 'REPLIED'
                ? 'pill pill-ok'
                : 'pill'
          }
        >
          {row.status}
        </span>
      </div>
      <dl className="kv report-kv">
        <div>
          <dt>Category</dt>
          <dd>{categoryLabel(row.category)}</dd>
        </div>
        <div>
          <dt>Rating</dt>
          <dd>{ratingLabel(row.rating)}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>
            {href ? (
              <Link href={href} className="inline-link">
                {row.email}
              </Link>
            ) : (
              row.email
            )}
          </dd>
        </div>
        <div>
          <dt>Name</dt>
          <dd>{row.name?.trim() || '—'}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{formatWhen(row.createdAt)}</dd>
        </div>
        <div>
          <dt>Ack email</dt>
          <dd>
            {row.ackEmailSentAt ? formatWhen(row.ackEmailSentAt) : 'Not sent'}
          </dd>
        </div>
      </dl>
      {row.pageUrl ? (
        <p className="meta">
          Page URL: <PageLink href={row.pageUrl} />
        </p>
      ) : null}
      {row.userAgent ? <p className="meta">User agent: {row.userAgent}</p> : null}
      <p>{row.message}</p>
      <label className="field">
        Update status
        <select
          className="input"
          value={row.status}
          disabled={updating}
          aria-label={`Update status for ${submitterLabel(row)}`}
          onChange={(event) =>
            void onStatusChange(row.id, event.target.value as FeedbackStatus)
          }
        >
          {FEEDBACK_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <DraftReplyPanel row={row} />
      <p className="meta">
        <Link href={feedbackPath({ status, category })} className="inline-link">
          Clear selection
        </Link>
      </p>
    </aside>
  )
}

function DraftReplyPanel({ row }: { row: FeedbackRow }) {
  const [draft, setDraft] = useState<FeedbackDraftReply | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setBusy(true)
      setError(null)
      setDraft(null)
      try {
        const next = await loadFeedbackDraftReply(row.id)
        if (!cancelled) setDraft(next)
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
  }, [row.id])

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      window.setTimeout(() => setCopied(null), 1800)
    } catch {
      setCopied(null)
      setError('Could not copy to clipboard')
    }
  }

  const mailto = draft
    ? feedbackMailto({
        to: row.email,
        subject: draft.subject,
        body: draft.bodyText,
      })
    : null

  return (
    <div className="draft-panel">
      <h3>Draft reply</h3>
      <p className="muted">
        Template quotes this submission. Copy or open mailto — do not auto-send
        from admin.
      </p>
      {busy ? <p className="muted">Loading draft…</p> : null}
      {error ? <p className="banner banner-error">{error}</p> : null}
      {draft ? (
        <>
          <label className="field">
            Subject
            <input
              className="input"
              readOnly
              value={draft.subject}
              aria-label="Draft reply subject"
            />
          </label>
          <label className="field">
            Body
            <textarea
              className="textarea"
              readOnly
              value={draft.bodyText}
              aria-label="Draft reply body"
            />
          </label>
          <div className="draft-actions">
            <button
              type="button"
              className="btn"
              onClick={() => void copy('subject', draft.subject)}
            >
              Copy subject
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => void copy('body', draft.bodyText)}
            >
              Copy body
            </button>
            {mailto ? (
              <a className="btn btn-primary" href={mailto}>
                Open mailto
              </a>
            ) : null}
          </div>
          {copied ? (
            <p className="meta">Copied {copied}.</p>
          ) : (
            <p className="meta">
              Human sends the personalized reply. Resend is not used here.
            </p>
          )}
        </>
      ) : null}
    </div>
  )
}

function SummaryMetric({
  label,
  value,
  href,
  active,
}: {
  label: string
  value: number | undefined
  href: string
  active: boolean
}) {
  return (
    <div className={active ? 'metric is-active' : 'metric'}>
      <p className="metric-label">{label}</p>
      <p className="metric-value">
        <Link href={href} className="inline-link">
          {value ?? '—'}
        </Link>
      </p>
    </div>
  )
}

function PageLink({ href }: { href: string }) {
  const absolute = href.startsWith('http://') || href.startsWith('https://')
  if (absolute) {
    return (
      <a className="inline-link" href={href} target="_blank" rel="noreferrer">
        {href}
      </a>
    )
  }
  return <span>{href}</span>
}
