'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { DataTable } from '@/components/ops/DataTable'
import { DraftFilters, FilterField, FilterToolbar } from '@/components/ops/FilterToolbar'
import { PaginationBar } from '@/components/ops/PaginationBar'
import { formatWhen } from '@/lib/dossier'
import {
  adjustFeedbackSummary,
  applyFeedbackClientFilters,
  categoryLabel,
  feedbackClientFilterActive,
  feedbackMailto,
  feedbackPath,
  feedbackPreview,
  mergeFeedbackRow,
  parseFeedbackCategoryFilter,
  parseFeedbackId,
  parseFeedbackQuery,
  parseFeedbackRatingFilter,
  parseFeedbackStatusFilter,
  ratingLabel,
  sortFeedbacksOpenFirst,
  submitterHref,
  submitterLabel,
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUSES,
  type FeedbackCategoryFilter,
  type FeedbackDraftReply,
  type FeedbackRatingFilter,
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
import {
  parseCursor,
  parseIsoDate,
  parsePageSize,
  parseSortDir,
  sortBy,
  type PageSize,
  type SortDir,
} from '@/lib/listQuery'
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion'

type FeedbackView = {
  status: FeedbackStatusFilter
  category: FeedbackCategoryFilter
  selectedId: string | null
  email: string
  rating: FeedbackRatingFilter
  q: string
  from: string
  to: string
  after: string | null
  first: PageSize
  sort: string
  dir: SortDir
}

const FEEDBACK_COLUMNS = [
  { key: 'submitter', label: 'Submitter', sortKey: 'submitter' },
  { key: 'email', label: 'Email', sortKey: 'email' },
  { key: 'category', label: 'Category', sortKey: 'category' },
  { key: 'rating', label: 'Rating', sortKey: 'rating' },
  { key: 'status', label: 'Status', sortKey: 'status' },
  { key: 'createdAt', label: 'Created', sortKey: 'createdAt' },
  { key: 'preview', label: 'Message' },
  { key: 'actions', label: 'Update' },
]

const CLIENT_FILTER_NOTE =
  'Email, rating, free-text, and date filter this API page only. adminFeedbacks paginates with first/after and filters status + category.'

function parseFeedbackView(params: Pick<URLSearchParams, 'get'>): FeedbackView {
  const sort = params.get('sort')?.trim() ?? ''
  return {
    status: parseFeedbackStatusFilter(params.get('status')),
    category: parseFeedbackCategoryFilter(params.get('category')),
    selectedId: parseFeedbackId(params.get('id')),
    email: parseFeedbackQuery(params.get('email')),
    rating: parseFeedbackRatingFilter(params.get('rating')),
    q: parseFeedbackQuery(params.get('q')),
    from: parseIsoDate(params.get('from')),
    to: parseIsoDate(params.get('to')),
    after: parseCursor(params.get('after')),
    first: parsePageSize(params.get('first'), 50),
    sort: ['submitter', 'email', 'category', 'rating', 'status', 'createdAt'].includes(
      sort,
    )
      ? sort
      : 'createdAt',
    dir: parseSortDir(params.get('dir') ?? 'desc'),
  }
}

export function FeedbackInbox() {
  const params = useSearchParams()
  const view = useMemo(() => parseFeedbackView(params), [params])
  return (
    <FeedbackPanel
      key={`${view.status}:${view.category}:${view.first}`}
      view={view}
    />
  )
}

function FeedbackPanel({ view }: { view: FeedbackView }) {
  const router = useRouter()
  const [rows, setRows] = useState<FeedbackRow[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [cursorStack, setCursorStack] = useState<string[]>([])
  const [summary, setSummary] = useState<FeedbackSummary | null>(null)
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
            status: view.status,
            category: view.category,
            after: view.after,
            first: view.first,
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
  }, [view.status, view.category, view.after, view.first])

  const visible = useMemo(() => {
    const filtered = applyFeedbackClientFilters(rows, view)
    const base =
      view.status === 'ALL' ? sortFeedbacksOpenFirst(filtered) : filtered
    if (view.sort === 'createdAt' && view.status === 'ALL') return base
    return sortBy(base, view.dir, (row) => {
      switch (view.sort) {
        case 'submitter':
          return submitterLabel(row)
        case 'email':
          return row.email
        case 'category':
          return row.category
        case 'rating':
          return row.rating ?? 0
        case 'status':
          return row.status
        default:
          return String(row.createdAt ?? '')
      }
    })
  }, [rows, view])

  function go(next: FeedbackView, replaceStack = false) {
    if (replaceStack) setCursorStack([])
    router.replace(
      feedbackPath({
        status: next.status,
        category: next.category,
        id: next.selectedId,
        email: next.email,
        rating: next.rating,
        q: next.q,
        from: next.from,
        to: next.to,
        after: next.after,
        first: next.first,
        sort: next.sort,
        dir: next.dir,
      }),
    )
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

  const selected = view.selectedId
    ? (visible.find((row) => row.id === view.selectedId) ??
      rows.find((row) => row.id === view.selectedId) ??
      null)
    : null

  useEffect(() => {
    if (!view.selectedId) return
    document.getElementById('feedback-detail')?.scrollIntoView({
      block: 'start',
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }, [view.selectedId, reduceMotion])

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
          href={feedbackPath({ ...view, status: 'ALL', after: null })}
          active={view.status === 'ALL'}
        />
        <SummaryMetric
          label="Open"
          value={summary?.open}
          href={feedbackPath({ ...view, status: 'OPEN', after: null })}
          active={view.status === 'OPEN'}
        />
        <SummaryMetric
          label="Reviewed"
          value={summary?.reviewed}
          href={feedbackPath({ ...view, status: 'REVIEWED', after: null })}
          active={view.status === 'REVIEWED'}
        />
        <SummaryMetric
          label="Replied"
          value={summary?.replied}
          href={feedbackPath({ ...view, status: 'REPLIED', after: null })}
          active={view.status === 'REPLIED'}
        />
      </dl>

      <DraftFilters key={feedbackPath({ ...view, id: null, after: null })} value={view}>
        {(draft, setDraft) => (
      <FilterToolbar
        onSubmit={(event) => {
          event.preventDefault()
          go({ ...draft, after: null, selectedId: view.selectedId }, true)
        }}
        onClearHref="/feedback"
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
                status: parseFeedbackStatusFilter(e.target.value),
              })
            }
          >
            <option value="ALL">All statuses</option>
            {FEEDBACK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Category">
          <select
            className="input"
            value={draft.category}
            onChange={(e) =>
              setDraft({
                ...draft,
                category: parseFeedbackCategoryFilter(e.target.value),
              })
            }
          >
            <option value="ALL">All categories</option>
            {FEEDBACK_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {categoryLabel(category)}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Email">
          <input
            className="input"
            value={draft.email}
            onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            placeholder="Contains…"
          />
        </FilterField>
        <FilterField label="Rating">
          <select
            className="input"
            value={draft.rating}
            onChange={(e) =>
              setDraft({
                ...draft,
                rating: parseFeedbackRatingFilter(e.target.value),
              })
            }
          >
            <option value="ALL">Any rating</option>
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value}/5
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Search">
          <input
            className="input search-input"
            value={draft.q}
            onChange={(e) => setDraft({ ...draft, q: e.target.value })}
            placeholder="Message, name, email"
            type="search"
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
      {busy ? <p className="muted">Loading feedback…</p> : null}

      <div className={selected ? 'layout-split has-selection' : 'layout-split'}>
        <div className="stack">
          {!busy && !error ? (
            <DataTable
              caption="Feedback"
              columns={FEEDBACK_COLUMNS}
              rows={visible}
              sort={view.sort}
              dir={view.dir}
              selectedId={view.selectedId}
              onSort={(sort, dir) => go({ ...view, sort, dir })}
              empty="No feedback for this filter."
              render={(row, key) => {
                if (key === 'submitter') {
                  return (
                    <Link
                      href={feedbackPath({ ...view, id: row.id })}
                      className="table-link"
                      aria-current={view.selectedId === row.id ? 'page' : undefined}
                    >
                      {submitterLabel(row)}
                    </Link>
                  )
                }
                if (key === 'email') {
                  const href = submitterHref(row)
                  return href ? (
                    <Link href={href} className="inline-link">
                      {row.email}
                    </Link>
                  ) : (
                    row.email
                  )
                }
                if (key === 'category') return categoryLabel(row.category)
                if (key === 'rating') return ratingLabel(row.rating)
                if (key === 'status') {
                  return (
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
                  )
                }
                if (key === 'createdAt') return formatWhen(row.createdAt)
                if (key === 'preview') return feedbackPreview(row.message)
                const updating = updatingId === row.id
                return (
                  <select
                    className="input table-select"
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
                )
              }}
            />
          ) : null}

          <PaginationBar
            shownCount={visible.length}
            fetchedCount={rows.length}
            pageSize={view.first}
            filtered={feedbackClientFilterActive(view)}
            onPageSize={(first: PageSize) =>
              go({ ...view, first, after: null }, true)
            }
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
        </div>

        <FeedbackDetail
          row={selected}
          view={view}
          updating={selected ? updatingId === selected.id : false}
          onStatusChange={onStatusChange}
        />
      </div>
    </section>
  )
}

function FeedbackDetail({
  row,
  view,
  updating,
  onStatusChange,
}: {
  row: FeedbackRow | null
  view: FeedbackView
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
        <Link
          href={feedbackPath({ ...view, id: null })}
          className="inline-link"
        >
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
