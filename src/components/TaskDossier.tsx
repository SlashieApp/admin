'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { TaskEditForm } from '@/components/TaskEditForm'
import { PostHogAnalytics } from '@/components/PostHogAnalytics'
import {
  AdminTask,
  AdminTaskByFilter,
  AdminTasksLegacy,
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
import type {
  AdminTaskByFilterQuery,
  AdminTaskQuery,
  AdminTasksLegacyQuery,
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

export function TaskDossier({ taskId }: { taskId: string }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <section className="stack">
      <div className="page-head">
        <Link href="/" className="btn btn-ghost">
          ← Tasks
        </Link>
        <h1>{task.title}</h1>
        <p className="mono muted">{taskId}</p>
      </div>

      {banner ? <p className="banner banner-warn">{banner}</p> : null}

      <div className="layout-split">
        <div className="stack">
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
                  {formatMoney(
                    task.budget?.amount,
                    task.budget?.currency,
                  )}
                  {task.budget?.type ? ` · ${task.budget.type}` : ''}
                </dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>
                  {task.location?.name || task.location?.address || '—'}
                </dd>
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
        </div>

        <TaskEditForm taskId={taskId} hidePageHead />
      </div>

      <PostHogAnalytics kind="task" taskId={taskId} />
    </section>
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
    const result = await apolloClient.query<AdminTasksLegacyQuery>({
      query: AdminTasksLegacy,
      variables: { id, search: id },
      fetchPolicy: 'network-only',
    })
    const task = result.data?.adminTasks?.[0]
    if (task) {
      return {
        data: {
          task: task as DossierTask,
          dossier: null,
          source: 'adminTasks',
        },
        banner:
          'Loaded via legacy adminTasks(search, id). Quotes, orders, and activity need BE-43 adminTask.',
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
