'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { DataTable, type DataColumn } from '@/components/DataTable'
import { FilterToolbar } from '@/components/FilterToolbar'
import { TablePager } from '@/components/TablePager'
import { formatWhen } from '@/lib/dossier'
import {
  adjustFeedbackSummary,
  categoryLabel,
  feedbackFiltersFromForm,
  feedbackMailto,
  feedbackPath,
  feedbackPreview,
  feedbackPageLocalNotice,
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUSES,
  mergeFeedbackRow,
  parseFeedbackListFilters,
  ratingLabel,
  refineFeedbacks,
  submitterHref,
  submitterLabel,
  type FeedbackDraftReply,
  type FeedbackListFilters,
  type FeedbackRow,
  type FeedbackStatus,
  type FeedbackSummary,
} from '@/lib/feedback'
import {
  listAdminFeedbacks,
  loadFeedbackDraftReply,
  loadFeedbackSummary,
  updateAdminFeedbackStatus,
} from '@/lib/feedbackInbox'
import { graphqlErrorMessage } from '@/lib/graphqlErrors'
import { nextSort } from '@/lib/listParams'
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion'

export function FeedbackInbox() {
  const params = useSearchParams()
  const filters = useMemo(() => parseFeedbackListFilters(params), [params])
  return <FeedbackPanel filters={filters} />
}

function FeedbackPanel({ filters }: { filters: FeedbackListFilters }) {
  const router = useRouter()
  const [rows, setRows] = useState<FeedbackRow[]>([])
  const [summary, setSummary] = useState<FeedbackSummary | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [cursorStack, setCursorStack] = useState<string[]>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const reduceMotion = usePrefersReducedMotion()

  useEffect(() => {
    let cancelled = false
    async function load() {
      setBusy(true)
      setError(null)
      setBanner(null)
      try {
        const [list, counts] = await Promise.all([
          listAdminFeedbacks({
            status: filters.status,
            category: filters.category,
            after: filters.after || null,
            first: filters.first,
          }),
          loadFeedbackSummary().catch(() => null),
        ])
        if (cancelled) return
        setRows(list.items)
        setNextCursor(list.nextCursor)
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
  }, [filters.status, filters.category, filters.after, filters.first])

  function go(next: Partial<FeedbackListFilters>, keepAfter = false) {
    const merged = { ...filters, ...next }
    if (!keepAfter && next.after === undefined) merged.after = ''
    router.push(feedbackPath(merged))
  }

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

  const visible = refineFeedbacks(rows, filters)
  const selected = filters.id
    ? (visible.find((row) => row.id === filters.id) ??
      rows.find((row) => row.id === filters.id) ??
      null)
    : null
  const localNotice = feedbackPageLocalNotice(filters)

  useEffect(() => {
    if (!filters.id) return
    document.getElementById('feedback-detail')?.scrollIntoView({
      block: 'start',
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }, [filters.id, reduceMotion])

  const columns: DataColumn<FeedbackRow>[] = [
    {
      key: 'submitter',
      header: 'Submitter',
      sortKey: 'submitter',
      render: (row) => (
        <Link
          href={feedbackPath({ ...filters, id: row.id })}
          className="table-link"
        >
          {submitterLabel(row)}
        </Link>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortKey: 'email',
      render: (row) => {
        const href = submitterHref(row)
        return href ? (
          <Link href={href} className="inline-link">
            {row.email}
          </Link>
        ) : (
          row.email
        )
      },
    },
    {
      key: 'category',
      header: 'Category',
      sortKey: 'category',
      render: (row) => categoryLabel(row.category),
    },
    {
      key: 'rating',
      header: 'Rating',
      sortKey: 'rating',
      render: (row) => ratingLabel(row.rating),
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
      ),
    },
    {
      key: 'created',
      header: 'Created',
      sortKey: 'created',
      render: (row) => formatWhen(row.createdAt),
    },
    {
      key: 'message',
      header: 'Message',
      render: (row) => feedbackPreview(row.message),
    },
  ]

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
          href={feedbackPath({ ...filters, status: 'ALL', after: '' })}
          active={filters.status === 'ALL'}
        />
        <SummaryMetric
          label="Open"
          value={summary?.open}
          href={feedbackPath({ ...filters, status: 'OPEN', after: '' })}
          active={filters.status === 'OPEN'}
        />
        <SummaryMetric
          label="Reviewed"
          value={summary?.reviewed}
          href={feedbackPath({ ...filters, status: 'REVIEWED', after: '' })}
          active={filters.status === 'REVIEWED'}
        />
        <SummaryMetric
          label="Replied"
          value={summary?.replied}
          href={feedbackPath({ ...filters, status: 'REPLIED', after: '' })}
          active={filters.status === 'REPLIED'}
        />
      </dl>

      <FilterToolbar
        key={feedbackPath({ ...filters, after: '', sort: '', dir: 'desc', id: null })}
        busy={busy}
        onSubmit={(event) => {
          event.preventDefault()
          setCursorStack([])
          go(feedbackFiltersFromForm(new FormData(event.currentTarget), filters))
        }}
        onClear={() => {
          setCursorStack([])
          router.push('/feedback')
        }}
      >
        <label className="field">
          Status
          <select className="input" name="status" defaultValue={filters.status}>
            <option value="ALL">All statuses</option>
            {FEEDBACK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Category
          <select
            className="input"
            name="category"
            defaultValue={filters.category}
          >
            <option value="ALL">All categories</option>
            {FEEDBACK_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {categoryLabel(category)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Email
          <input
            className="input"
            name="email"
            defaultValue={filters.email}
            placeholder="Contains…"
          />
        </label>
        <label className="field">
          Rating
          <select
            className="input"
            name="rating"
            defaultValue={filters.rating ?? ''}
          >
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value}/5
              </option>
            ))}
          </select>
        </label>
        <label className="field field-wide">
          Free text
          <input
            className="input search-input"
            name="q"
            defaultValue={filters.q}
            placeholder="Message, name, or page"
            type="search"
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

      <div className={selected ? 'layout-split has-selection' : 'layout-split'}>
        <DataTable
          rows={visible}
          columns={columns}
          rowKey={(row) => row.id}
          sort={filters.sort}
          dir={filters.dir}
          onSort={(key) => go(nextSort(filters.sort, filters.dir, key), true)}
          loading={busy}
          empty="No feedback for this filter."
          renderCard={(row) => (
            <FeedbackCard
              row={row}
              href={feedbackPath({ ...filters, id: row.id })}
              selected={filters.id === row.id}
            />
          )}
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
        <FeedbackDetail
          row={selected}
          filters={filters}
          updating={selected ? updatingId === selected.id : false}
          onStatusChange={onStatusChange}
        />
      </div>
    </section>
  )
}

function FeedbackCard({
  row,
  href,
  selected,
}: {
  row: FeedbackRow
  href: string
  selected: boolean
}) {
  return (
    <>
      <div className="card-top">
        <Link
          href={href}
          className="table-link"
          aria-current={selected ? 'page' : undefined}
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
      <p className="meta">
        {categoryLabel(row.category)} · {ratingLabel(row.rating)} · {row.email}
      </p>
      <p>{feedbackPreview(row.message)}</p>
    </>
  )
}

function FeedbackDetail({
  row,
  filters,
  updating,
  onStatusChange,
}: {
  row: FeedbackRow | null
  filters: FeedbackListFilters
  updating: boolean
  onStatusChange: (id: string, next: FeedbackStatus) => Promise<void>
}) {
  if (!row) {
    return (
      <aside id="feedback-detail" className="section sticky-detail">
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
    <aside id="feedback-detail" className="section sticky-detail">
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
        <Link href={feedbackPath({ ...filters, id: null })} className="inline-link">
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
        from admin. Use Copy if the message is long; some mail apps truncate
        mailto bodies.
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
