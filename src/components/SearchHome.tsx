'use client'

import Link from 'next/link'
import { useState } from 'react'

import {
  AdminTasks,
  AdminWorkers,
  Tasks,
  Workers,
} from '@/graphql/operations'
import { apolloClient } from '@/lib/apollo'
import {
  graphqlErrorMessage,
  isMissingAdminFieldError,
} from '@/lib/graphqlErrors'
import { toAdminSearchVariables } from '@/lib/search'
import type {
  AdminTasksQuery,
  AdminWorkersQuery,
  TasksQuery,
  WorkersQuery,
} from '@codegen/schema'

type Mode = 'tasks' | 'workers'

type TaskHit = NonNullable<AdminTasksQuery['adminTasks']>[number]
type WorkerHit = NonNullable<AdminWorkersQuery['adminWorkers']>[number]

export function SearchHome() {
  const [mode, setMode] = useState<Mode>('tasks')
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usedFallback, setUsedFallback] = useState(false)
  const [tasks, setTasks] = useState<TaskHit[]>([])
  const [workers, setWorkers] = useState<WorkerHit[]>([])

  async function runSearch(event: React.FormEvent) {
    event.preventDefault()
    const query = q.trim()
    if (!query) return
    setBusy(true)
    setError(null)
    setUsedFallback(false)

    try {
      if (mode === 'tasks') {
        const hits = await searchTasks(query)
        setTasks(hits.rows)
        setUsedFallback(hits.fallback)
        setWorkers([])
      } else {
        const hits = await searchWorkers(query)
        setWorkers(hits.rows)
        setUsedFallback(hits.fallback)
        setTasks([])
      }
    } catch (err) {
      setError(graphqlErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="stack">
      <div>
        <h1>Search</h1>
        <p className="muted">
          Find marketplace tasks or workers by text or id, then open god-mode
          edit for a task.
        </p>
      </div>

      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'tasks'}
          className={mode === 'tasks' ? 'tab is-active' : 'tab'}
          onClick={() => setMode('tasks')}
        >
          Tasks
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'workers'}
          className={mode === 'workers' ? 'tab is-active' : 'tab'}
          onClick={() => setMode('workers')}
        >
          Workers
        </button>
      </div>

      <form className="search-row" onSubmit={(e) => void runSearch(e)}>
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            mode === 'tasks'
              ? 'Task title, description, or id'
              : 'Worker name, skill, or id'
          }
          aria-label={mode === 'tasks' ? 'Search tasks' : 'Search workers'}
        />
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Searching…' : 'Search'}
        </button>
      </form>

      {usedFallback ? (
        <p className="banner banner-warn">
          BE-42 admin search is not on this Apollo yet. Showing public
          marketplace search instead.
        </p>
      ) : null}
      {error ? <p className="banner banner-error">{error}</p> : null}

      {mode === 'tasks' ? (
        <ul className="list">
          {tasks.map((task) => (
            <li key={task.id} className="card">
              <Link href={`/tasks/${task.id}`} className="card-link">
                <div className="card-top">
                  <strong>{task.title}</strong>
                  <span className="pill">{task.status}</span>
                </div>
                <p className="muted clamp">{task.description}</p>
                <p className="meta">
                  {task.category}
                  {task.poster?.email ? ` · ${task.poster.email}` : ''}
                  {task.hidden ? ' · hidden' : ''}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="list">
          {workers.map((worker) => (
            <li key={worker.id} className="card">
              <Link href={`/workers/${worker.id}`} className="card-link">
                <div className="card-top">
                  <strong>
                    {worker.profile?.name || worker.legalName || worker.id}
                  </strong>
                  {worker.isVerified ? (
                    <span className="pill">verified</span>
                  ) : null}
                </div>
                <p className="muted clamp">
                  {worker.tagline || worker.bio || 'No tagline'}
                </p>
                <p className="meta">
                  {worker.primaryCategory ?? 'uncategorised'}
                  {worker.user?.email ? ` · ${worker.user.email}` : ''}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

async function searchTasks(query: string): Promise<{
  rows: TaskHit[]
  fallback: boolean
}> {
  const vars = toAdminSearchVariables(query)
  try {
    const result = await apolloClient.query<AdminTasksQuery>({
      query: AdminTasks,
      variables: vars,
      fetchPolicy: 'network-only',
    })
    return { rows: result.data?.adminTasks ?? [], fallback: false }
  } catch (error) {
    if (!isMissingAdminFieldError(error)) throw error
    const result = await apolloClient.query<TasksQuery>({
      query: Tasks,
      variables: { filter: { search: query } },
      fetchPolicy: 'network-only',
    })
    return { rows: result.data?.tasks ?? [], fallback: true }
  }
}

async function searchWorkers(query: string): Promise<{
  rows: WorkerHit[]
  fallback: boolean
}> {
  const vars = toAdminSearchVariables(query)
  try {
    const result = await apolloClient.query<AdminWorkersQuery>({
      query: AdminWorkers,
      variables: vars,
      fetchPolicy: 'network-only',
    })
    return { rows: result.data?.adminWorkers ?? [], fallback: false }
  } catch (error) {
    if (!isMissingAdminFieldError(error)) throw error
    const result = await apolloClient.query<WorkersQuery>({
      query: Workers,
      variables: { filter: { search: query } },
      fetchPolicy: 'network-only',
    })
    return { rows: result.data?.workers ?? [], fallback: true }
  }
}
