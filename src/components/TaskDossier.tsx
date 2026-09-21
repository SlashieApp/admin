'use client'

import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { CopyButton } from '@/components/CopyButton'
import { PostHogAnalytics } from '@/components/PostHogAnalytics'
import { TaskEditForm } from '@/components/TaskEditForm'
import {
  AdminTask,
  AdminTaskByFilter,
  Task,
  TaskCore,
} from '@/graphql/operations'
import { apolloClient } from '@/lib/apollo'
import {
  activityFromDossier,
  displayName,
  formatMoney,
  formatWhen,
  linkedWorkersFromDossier,
} from '@/lib/dossier'
import {
  graphqlErrorMessage,
  isMissingAdminFieldError,
} from '@/lib/graphqlErrors'
import { publicTaskUrl } from '@/lib/publicLinks'
import { listAdminReports } from '@/lib/reportInbox'
import {
  parseTaskDossierTab,
  TASK_DOSSIER_TABS,
  taskDossierPath,
  type TaskDossierTab,
} from '@/lib/taskDossier'
import type {
  AdminTaskByFilterQuery,
  AdminTaskQuery,
  TaskCoreQuery,
  TaskQuery,
} from '@codegen/schema'

type DossierTask = NonNullable<AdminTaskByFilterQuery['adminTasks']>[number]
type DossierPayload = NonNullable<AdminTaskQuery['adminTask']>

type Loaded = {
  task: DossierTask
  dossier: DossierPayload | null
  source: 'adminTask' | 'adminTasks' | 'public'
}

type RelatedReport = {
  id: string
  status: string
  reason: string
}

const TAB_LABELS: Record<TaskDossierTab, string> = {
  overview: 'Overview',
  quotes: 'Quotes',
  activity: 'Activity',
  admin: 'Admin',
}

export function TaskDossier({ taskId }: { taskId: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const tab = parseTaskDossierTab(params.get('tab'))
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [relatedReports, setRelatedReports] = useState<RelatedReport[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      setBanner(null)
      try {
        const next = await loadDossier(taskId)
        if (cancelled) return
        setLoaded(next.data)
        setBanner(next.banner)
      } catch (err) {
        if (!cancelled) setError(graphqlErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [taskId])

  useEffect(() => {
    let cancelled = false
    async function loadRelated() {
      try {
        const result = await listAdminReports({
          status: 'ALL',
          targetType: 'TASK',
          first: 50,
        })
        if (cancelled) return
        setRelatedReports(
          result.items
            .filter((row) => row.targetId === taskId)
            .map((row) => ({
              id: row.id,
              status: row.status,
              reason: row.reason,
            })),
        )
      } catch {
        if (!cancelled) setRelatedReports([])
      }
    }
    void loadRelated()
    return () => {
      cancelled = true
    }
  }, [taskId])

  const poster = loaded?.dossier?.poster ?? loaded?.task.poster ?? null
  const quotes = useMemo(
    () => loaded?.dossier?.quotes ?? loaded?.task.quotes ?? [],
    [loaded],
  )
  const orders = useMemo(
    () => loaded?.dossier?.orders ?? loaded?.task.orders ?? [],
    [loaded],
  )
  const workers = useMemo(
    () =>
      linkedWorkersFromDossier({
        workers: loaded?.dossier?.workers,
        quotes,
        orders,
      }),
    [loaded, quotes, orders],
  )
  const activity = useMemo(
    () =>
      activityFromDossier({
        activity: loaded?.dossier?.activity,
        timeline: loaded?.task.timeline,
      }),
    [loaded],
  )

  if (loading) return <p className="muted">Loading task dossier…</p>
  if (error) return <p className="banner banner-error">{error}</p>
  if (!loaded) return <p className="muted">Task not found.</p>

  const task = loaded.task
  const liveUrl = publicTaskUrl(taskId)

  function goTab(next: TaskDossierTab) {
    router.replace(taskDossierPath(taskId, next), { scroll: false })
  }

  return (
    <section className="stack">
      <div className="page-head">
        <Link href="/" className="btn btn-ghost">
          ← Tasks
        </Link>
        <h1>{task.title}</h1>
        <p className="mono muted">{taskId}</p>
        <div className="useful-links">
          <a
            href={liveUrl}
            className="btn btn-ghost"
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={16} aria-hidden />
            Open live task
          </a>
          {poster?.id ? (
            <Link href={`/users/${poster.id}`} className="btn btn-ghost">
              Poster in admin
            </Link>
          ) : null}
          <CopyButton value={taskId} label="Copy id" />
          {relatedReports.slice(0, 3).map((report) => (
            <Link
              key={report.id}
              href="/reports"
              className="btn btn-ghost"
              title={`${report.reason} · ${report.status}`}
            >
              Report {report.status.toLowerCase()}
            </Link>
          ))}
        </div>
      </div>

      {banner ? <p className="banner banner-warn">{banner}</p> : null}

      <div className="tabs" role="tablist" aria-label="Task dossier">
        {TASK_DOSSIER_TABS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`task-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`task-panel-${id}`}
            className={tab === id ? 'tab is-active' : 'tab'}
            onClick={() => goTab(id)}
          >
            {TAB_LABELS[id]}
            {id === 'quotes' && quotes.length > 0 ? ` (${quotes.length})` : null}
            {id === 'admin' ? ' / God-mode' : null}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div
          role="tabpanel"
          id="task-panel-overview"
          aria-labelledby="task-tab-overview"
          className="stack"
        >
          <OverviewPanel
            task={task}
            poster={poster}
            workers={workers}
            relatedReports={relatedReports}
          />
        </div>
      ) : null}

      {tab === 'quotes' ? (
        <div
          role="tabpanel"
          id="task-panel-quotes"
          aria-labelledby="task-tab-quotes"
          className="stack"
        >
          <QuotesPanel quotes={quotes} orders={orders} />
        </div>
      ) : null}

      {tab === 'activity' ? (
        <div
          role="tabpanel"
          id="task-panel-activity"
          aria-labelledby="task-tab-activity"
          className="stack"
        >
          <ActivityPanel activity={activity} />
          <PostHogAnalytics kind="task" taskId={taskId} />
        </div>
      ) : null}

      {tab === 'admin' ? (
        <div
          role="tabpanel"
          id="task-panel-admin"
          aria-labelledby="task-tab-admin"
          className="stack"
        >
          <TaskEditForm taskId={taskId} hidePageHead />
        </div>
      ) : null}
    </section>
  )
}

function OverviewPanel({
  task,
  poster,
  workers,
  relatedReports,
}: {
  task: DossierTask
  poster: {
    id?: string | null
    email?: string | null
    profile?: { name?: string | null } | null
  } | null
  workers: ReturnType<typeof linkedWorkersFromDossier>
  relatedReports: RelatedReport[]
}) {
  return (
    <>
      <article className="section">
        <h2>Creator</h2>
        {poster ? (
          <p>
            {poster.id ? (
              <Link href={`/users/${poster.id}`} className="inline-link">
                {displayName(poster)}
              </Link>
            ) : (
              <strong>{displayName(poster)}</strong>
            )}
            {poster.email ? (
              <span className="muted"> · {poster.email}</span>
            ) : null}
          </p>
        ) : (
          <p className="muted">No poster user on this task.</p>
        )}
        <dl className="kv">
          <div>
            <dt>Status</dt>
            <dd>{task.status}</dd>
          </div>
          <div>
            <dt>Category</dt>
            <dd>{task.category}</dd>
          </div>
          <div>
            <dt>Hidden</dt>
            <dd>{task.hidden ? 'yes' : 'no'}</dd>
          </div>
          <div>
            <dt>Views</dt>
            <dd>{task.views ?? '—'}</dd>
          </div>
          <div>
            <dt>When</dt>
            <dd>
              {task.datetime
                ? [task.datetime.type, task.datetime.date, task.datetime.time]
                    .filter(Boolean)
                    .join(' · ') || '—'
                : '—'}
            </dd>
          </div>
          <div>
            <dt>Budget</dt>
            <dd>
              {formatMoney(task.budget?.amount, task.budget?.currency)}
              {task.budget?.type ? ` · ${task.budget.type}` : ''}
            </dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{task.location?.name || task.location?.address || '—'}</dd>
          </div>
        </dl>
        <p>{task.description}</p>
      </article>

      <article className="section">
        <h2>Linked workers</h2>
        {workers.length === 0 ? (
          <p className="muted">No workers linked via quotes or orders.</p>
        ) : (
          <ul className="list">
            {workers.map((row) => (
              <li key={row.id} className="card card-pad">
                <div className="card-top">
                  {row.href ? (
                    <Link href={row.href} className="inline-link">
                      {row.label}
                    </Link>
                  ) : (
                    <strong>{row.label}</strong>
                  )}
                  {row.workerId ? (
                    <span className="pill">worker</span>
                  ) : (
                    <span className="pill">user</span>
                  )}
                </div>
                <p className="meta">
                  {row.email ?? '—'}
                  {row.workerId ? ` · worker ${row.workerId}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </article>

      {relatedReports.length > 0 ? (
        <article className="section">
          <h2>Related reports</h2>
          <ul className="list">
            {relatedReports.map((report) => (
              <li key={report.id} className="card card-pad">
                <div className="card-top">
                  <Link href="/reports" className="inline-link">
                    {report.reason}
                  </Link>
                  <span className="pill">{report.status}</span>
                </div>
                <p className="meta mono">{report.id}</p>
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </>
  )
}

function QuotesPanel({
  quotes,
  orders,
}: {
  quotes: NonNullable<DossierTask['quotes']>
  orders: NonNullable<DossierTask['orders']>
}) {
  return (
    <>
      <article className="section">
        <h2>Quotes</h2>
        {quotes.length === 0 ? (
          <p className="muted">No quotes.</p>
        ) : (
          <ul className="list">
            {quotes.map((quote) => (
              <li key={quote.id} className="card card-pad">
                <div className="card-top">
                  <strong>{quote.status}</strong>
                  <span className="pill">
                    {formatMoney(quote.price?.amount, quote.price?.currency)}
                  </span>
                </div>
                <p className="meta">
                  {quote.worker?.id ? (
                    <Link
                      href={`/users/${quote.worker.id}`}
                      className="inline-link"
                    >
                      {displayName(quote.worker)}
                    </Link>
                  ) : (
                    'Unknown worker'
                  )}
                  {` · ${formatWhen(quote.createdAt)}`}
                </p>
                {quote.message ? <p>{quote.message}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="section">
        <h2>Orders</h2>
        {orders.length === 0 ? (
          <p className="muted">No orders.</p>
        ) : (
          <ul className="list">
            {orders.map((order) => (
              <li key={order.id} className="card card-pad">
                <div className="card-top">
                  <strong>{order.status}</strong>
                  <span className="pill">
                    {formatMoney(
                      order.agreedPrice?.amount,
                      order.agreedPrice?.currency,
                    )}
                  </span>
                </div>
                <p className="meta">
                  {order.workerUserId ? (
                    <Link
                      href={`/users/${order.workerUserId}`}
                      className="inline-link"
                    >
                      Worker user {order.workerUserId}
                    </Link>
                  ) : (
                    'No worker user'
                  )}
                  {` · ${formatWhen(order.createdAt)}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </article>
    </>
  )
}

function ActivityPanel({
  activity,
}: {
  activity: ReturnType<typeof activityFromDossier>
}) {
  return (
    <article className="section">
      <h2>Activity and logs</h2>
      {activity.length === 0 ? (
        <p className="muted">No notifications or timeline events.</p>
      ) : (
        <ul className="list">
          {activity.map((row) => (
            <li key={row.id} className="card card-pad">
              <div className="card-top">
                <strong>{row.title}</strong>
                <span className="pill">{row.kind}</span>
              </div>
              {row.body ? <p>{row.body}</p> : null}
              <p className="meta">{formatWhen(row.at)}</p>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

async function loadDossier(id: string): Promise<{
  data: Loaded
  banner: string | null
}> {
  try {
    const result = await apolloClient.query<AdminTaskQuery>({
      query: AdminTask,
      variables: { id },
      fetchPolicy: 'network-only',
    })
    const dossier = result.data?.adminTask
    if (dossier?.task) {
      return {
        data: { task: dossier.task, dossier, source: 'adminTask' },
        banner: null,
      }
    }
  } catch (error) {
    if (!isMissingAdminFieldError(error)) throw error
  }

  try {
    const result = await apolloClient.query<AdminTaskByFilterQuery>({
      query: AdminTaskByFilter,
      variables: { filter: { id }, first: 1 },
      fetchPolicy: 'network-only',
    })
    const task = result.data?.adminTasks?.[0]
    if (task) {
      return {
        data: { task, dossier: null, source: 'adminTasks' },
        banner:
          'adminTask dossier is not on this Apollo yet (BE-43). Showing related records from adminTasks.',
      }
    }
  } catch (error) {
    if (!isMissingAdminFieldError(error)) throw error
  }

  try {
    const result = await apolloClient.query<TaskQuery>({
      query: Task,
      variables: { id },
      fetchPolicy: 'network-only',
    })
    const task = result.data?.task
    if (task) {
      return {
        data: { task, dossier: null, source: 'public' },
        banner:
          'Loaded via public task query. Related records may be incomplete until BE-43 adminTask is deployed.',
      }
    }
  } catch (error) {
    if (!isMissingAdminFieldError(error)) throw error
  }

  const result = await apolloClient.query<TaskCoreQuery>({
    query: TaskCore,
    variables: { id },
    fetchPolicy: 'network-only',
  })
  const task = result.data?.task
  if (!task) throw new Error('Task not found')
  return {
    data: {
      task: task as DossierTask,
      dossier: null,
      source: 'public',
    },
    banner:
      'Loaded core task fields only. Quotes, orders, and activity are unavailable on this API.',
  }
}
