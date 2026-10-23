'use client'

import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { ConfirmAction } from '@/components/ConfirmAction'
import { CopyButton } from '@/components/CopyButton'
import { PostHogAnalytics } from '@/components/PostHogAnalytics'
import { TaskEditForm } from '@/components/TaskEditForm'
import { AdminSetTaskSuspended, AdminTask } from '@/graphql/operations'
import { apolloClient } from '@/lib/apollo'
import {
  activityFromDossier,
  displayName,
  formatMoney,
  formatWhen,
  linkedWorkersFromDossier,
  ordersNewestFirst,
} from '@/lib/dossier'
import { graphqlErrorMessage } from '@/lib/graphqlErrors'
import { publicTaskUrl } from '@/lib/publicLinks'
import {
  ACCOUNT_SUSPENDED_LABEL,
  isSuspendedBySlashie,
  suspendTaskConfirm,
  suspensionSentence,
  taskSuspensionResult,
  unsuspendTaskConfirm,
} from '@/lib/suspension'
import {
  parseTaskDossierTab,
  TASK_DOSSIER_TABS,
  taskDossierPath,
  type TaskDossierTab,
} from '@/lib/taskDossier'
import type {
  AdminSetTaskSuspendedMutation,
  AdminTaskQuery,
} from '@codegen/schema'

type Dossier = AdminTaskQuery['adminTask']
type DossierTask = Dossier['task']
type DossierOrder = Dossier['orders'][number]

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
  const [dossier, setDossier] = useState<Dossier | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [suspending, setSuspending] = useState(false)
  const [notice, setNotice] = useState<{
    tone: 'ok' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await apolloClient.query<AdminTaskQuery>({
          query: AdminTask,
          variables: { id: taskId },
          fetchPolicy: 'network-only',
        })
        if (!cancelled) setDossier(result.data?.adminTask ?? null)
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

  const workers = useMemo(
    () =>
      linkedWorkersFromDossier({
        workers: dossier?.workers,
        quotes: dossier?.quotes,
        orders: dossier?.orders,
      }),
    [dossier],
  )
  const activity = useMemo(
    () => activityFromDossier(dossier?.activity),
    [dossier],
  )

  async function onSetSuspended(suspended: boolean) {
    setSuspending(true)
    setNotice(null)
    try {
      const result = await apolloClient.mutate<AdminSetTaskSuspendedMutation>({
        mutation: AdminSetTaskSuspended,
        variables: { id: taskId, suspended },
      })
      const updated = result.data?.adminSetTaskSuspended
      if (!updated) throw new Error('adminSetTaskSuspended returned no task')
      setDossier((current) => current && { ...current, task: updated })
      setNotice({
        tone: 'ok',
        text: taskSuspensionResult(suspended, updated.suspension),
      })
    } catch (err) {
      setNotice({ tone: 'error', text: graphqlErrorMessage(err) })
      setSuspending(false)
      return
    }
    // The suspension is saved. Reload so the Activity tab shows the new
    // TASK_SUSPENDED / TASK_UNSUSPENDED row; if that fails the page is only
    // missing the log line, so it does not turn the saved change into an error.
    try {
      const result = await apolloClient.query<AdminTaskQuery>({
        query: AdminTask,
        variables: { id: taskId },
        fetchPolicy: 'network-only',
      })
      if (result.data?.adminTask) setDossier(result.data.adminTask)
    } catch {
      // Keep the task state from the mutation.
    } finally {
      setSuspending(false)
    }
  }

  if (loading) return <p className="muted">Loading task dossier…</p>
  if (error) return <p className="banner banner-error">{error}</p>
  if (!dossier) return <p className="muted">Task not found.</p>

  const { task, poster, quotes, orders } = dossier
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
          {isSuspendedBySlashie(task.suspension) ? (
            <ConfirmAction
              key="unsuspend"
              label="Unsuspend task"
              busyLabel="Unsuspending…"
              confirmText={unsuspendTaskConfirm(task.suspension)}
              busy={suspending}
              onConfirm={() => void onSetSuspended(false)}
            />
          ) : (
            <ConfirmAction
              key="suspend"
              danger
              label="Suspend task"
              busyLabel="Suspending…"
              confirmText={suspendTaskConfirm(task.suspension)}
              busy={suspending}
              onConfirm={() => void onSetSuspended(true)}
            />
          )}
        </div>
      </div>

      {suspensionSentence(task.suspension) ? (
        <p className="banner banner-warn">
          {suspensionSentence(task.suspension)}
        </p>
      ) : null}
      {notice ? (
        <p
          className={
            notice.tone === 'ok' ? 'banner banner-ok' : 'banner banner-error'
          }
          role={notice.tone === 'error' ? 'alert' : 'status'}
        >
          {notice.text}
        </p>
      ) : null}

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
          <OverviewPanel task={task} poster={poster ?? null} workers={workers} />
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
}: {
  task: DossierTask
  poster: {
    id?: string | null
    email?: string | null
    profile?: { name?: string | null } | null
  } | null
  workers: ReturnType<typeof linkedWorkersFromDossier>
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
            <dt>Categories</dt>
            <dd>{task.categories.join(', ') || '—'}</dd>
          </div>
          <div>
            <dt>Suspended by Slashie</dt>
            <dd>{task.suspension?.bySlashie ? 'yes' : 'no'}</dd>
          </div>
          <div>
            <dt>Poster&apos;s account suspended</dt>
            <dd>{task.suspension?.posterSuspended ? 'yes' : 'no'}</dd>
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

    </>
  )
}

function QuotesPanel({
  quotes,
  orders,
}: {
  quotes: Dossier['quotes']
  orders: Dossier['orders']
}) {
  const sortedOrders = ordersNewestFirst(orders)
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
                  <span className="pills">
                    {quote.workerSuspended ? (
                      <span className="pill pill-warn">
                        {ACCOUNT_SUSPENDED_LABEL}
                      </span>
                    ) : null}
                    <span className="pill">
                      {formatMoney(quote.price?.amount, quote.price?.currency)}
                    </span>
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
        {sortedOrders.length > 1 ? (
          <p className="meta">
            {sortedOrders.length} orders on this task, newest first. A
            cancelled order stays on record after the task is reopened.
          </p>
        ) : null}
        {sortedOrders.length === 0 ? (
          <p className="muted">No orders.</p>
        ) : (
          <ul className="list">
            {sortedOrders.map((order, index) => (
              <li key={order.id} className="card card-pad">
                <div className="card-top">
                  <strong>{order.status}</strong>
                  <span className="pills">
                    {sortedOrders.length > 1 ? (
                      <span className="pill">
                        {index === 0 ? 'Latest' : 'Earlier'}
                      </span>
                    ) : null}
                    <span className="pill">
                      {formatMoney(
                        order.agreedPrice?.amount,
                        order.agreedPrice?.currency,
                      )}
                    </span>
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
                  {` · created ${formatWhen(order.createdAt)}`}
                </p>
                <OrderTimes order={order} />
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
        <p className="muted">No flashes or timeline events.</p>
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

function OrderTimes({ order }: { order: DossierOrder }) {
  const rows: Array<[string, string]> = [
    [
      'Booked',
      `${formatWhen(order.bookedStart)}${order.bookedEnd ? ` → ${formatWhen(order.bookedEnd)}` : ''}`,
    ],
  ]
  if (order.pendingRequest) {
    rows.push([
      'Pending request',
      `${order.pendingRequest.kind} by ${order.pendingRequest.requestedByUserId} · ${formatWhen(order.pendingRequest.requestedAt)}`,
    ])
  }
  for (const change of order.rescheduleHistory) {
    rows.push([
      'Rescheduled',
      `${formatWhen(change.previousStart)} → ${formatWhen(change.start)} · by ${change.requestedByUserId}, confirmed ${formatWhen(change.confirmedAt)}`,
    ])
  }
  if (order.autoDoneAt) rows.push(['Auto-Done', formatWhen(order.autoDoneAt)])
  if (order.closedAt) rows.push(['Closed', formatWhen(order.closedAt)])
  return (
    <dl className="kv">
      {rows.map(([label, value], index) => (
        <div key={`${label}-${index}`}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
