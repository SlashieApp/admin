'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import {
  AdminTasks,
  AdminTasksLegacy,
  AdminUsers,
  Tasks,
} from '@/graphql/operations'
import { apolloClient } from '@/lib/apollo'
import {
  graphqlErrorMessage,
  isMissingAdminFieldError,
} from '@/lib/graphqlErrors'
import {
  parseAdminHomeMode,
  toAdminSearchVariables,
  toAdminTaskListVariables,
  toAdminUserListVariables,
} from '@/lib/search'
import { displayName } from '@/lib/dossier'
import { isWorkerUser } from '@/lib/userInput'
import type {
  AdminTasksLegacyQuery,
  AdminTasksQuery,
  AdminUsersQuery,
  TasksQuery,
} from '@codegen/schema'

type TaskHit = AdminTasksQuery['adminTasks'][number]
type UserHit = AdminUsersQuery['adminUsers'][number]

export function SearchHome() {
  const searchParams = useSearchParams()
  const mode = parseAdminHomeMode(searchParams.get('mode'))
  return <SearchPanel key={mode} mode={mode} />
}

function SearchPanel({ mode }: { mode: 'tasks' | 'users' }) {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [tasks, setTasks] = useState<TaskHit[]>([])
  const [users, setUsers] = useState<UserHit[]>([])

  useEffect(() => {
    let cancelled = false
    async function autoload() {
      try {
        if (mode === 'users') {
          const hits = await listUsers('')
          if (cancelled) return
          setUsers(hits.rows)
          setTasks([])
          setBanner(hits.banner)
        } else {
          const hits = await listTasks('')
          if (cancelled) return
          setTasks(hits.rows)
          setUsers([])
          setBanner(hits.banner)
        }
      } catch (err) {
        if (!cancelled) setError(graphqlErrorMessage(err))
      } finally {
        if (!cancelled) setBusy(false)
      }
    }
    void autoload()
    return () => {
      cancelled = true
    }
  }, [mode])

  async function load(raw: string) {
    setBusy(true)
    setError(null)
    setBanner(null)
    try {
      if (mode === 'users') {
        const hits = await listUsers(raw)
        setUsers(hits.rows)
        setTasks([])
        setBanner(hits.banner)
      } else {
        const hits = await listTasks(raw)
        setTasks(hits.rows)
        setUsers([])
        setBanner(hits.banner)
      }
    } catch (err) {
      setError(graphqlErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    void load(q)
  }

  function onQueryChange(value: string) {
    const wasEmpty = q.trim() === ''
    setQ(value)
    if (!wasEmpty && value.trim() === '') void load('')
  }

  return (
    <section className="stack">
      <div>
        <h1>{mode === 'users' ? 'Users' : 'Tasks'}</h1>
        <p className="muted">
          {mode === 'users'
            ? 'Search marketplace users by email, name, or id. An empty search loads recent users.'
            : 'Latest marketplace tasks load automatically. Search is an optional filter.'}
        </p>
      </div>

      <div className="tabs" role="tablist">
        <Link
          href="/"
          role="tab"
          aria-selected={mode === 'tasks'}
          className={mode === 'tasks' ? 'tab is-active' : 'tab'}
        >
          Tasks
        </Link>
        <Link
          href="/?mode=users"
          role="tab"
          aria-selected={mode === 'users'}
          className={mode === 'users' ? 'tab is-active' : 'tab'}
        >
          Users
        </Link>
      </div>

      <form className="search-row" onSubmit={onSubmit}>
        <label className="field">
          {mode === 'users' ? 'Search users' : 'Search tasks'}
          <input
            className="input"
            value={q}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={
              mode === 'users'
                ? 'Email, name, or user id'
                : 'Task title, description, or id'
            }
            type="search"
            autoComplete="off"
          />
        </label>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Loading…' : 'Search'}
        </button>
      </form>

      {banner ? <p className="banner banner-warn">{banner}</p> : null}
      {error ? <p className="banner banner-error">{error}</p> : null}

      {mode === 'users' ? (
        <ul className="list">
          {users.map((user) => (
            <li key={user.id} className="card">
              <Link href={`/users/${user.id}`} className="card-link">
                <div className="card-top">
                  <strong>{displayName(user)}</strong>
                  {isWorkerUser(user) ? (
                    <span className="pill pill-ok">worker</span>
                  ) : (
                    <span className="pill">not a worker</span>
                  )}
                </div>
                <p className="muted">{user.email}</p>
                <p className="meta">
                  {user.emailVerified ? 'email verified' : 'email unverified'}
                  {user.worker?.legalName ? ` · ${user.worker.legalName}` : ''}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
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
      )}

      {!busy && mode === 'tasks' && tasks.length === 0 ? (
        <p className="muted">No tasks found.</p>
      ) : null}
      {!busy && mode === 'users' && users.length === 0 && !error ? (
        <p className="muted">No users found.</p>
      ) : null}
    </section>
  )
}

async function listTasks(query: string): Promise<{
  rows: TaskHit[]
  banner: string | null
}> {
  const vars = toAdminTaskListVariables(query)
  try {
    const result = await apolloClient.query<AdminTasksQuery>({
      query: AdminTasks,
      variables: vars,
      fetchPolicy: 'network-only',
    })
    return { rows: result.data?.adminTasks ?? [], banner: null }
  } catch (error) {
    if (!isMissingAdminFieldError(error)) throw error
  }

  try {
    const result = await apolloClient.query<AdminTasksLegacyQuery>({
      query: AdminTasksLegacy,
      variables: toAdminSearchVariables(query),
      fetchPolicy: 'network-only',
    })
    return {
      rows: result.data?.adminTasks ?? [],
      banner:
        'This Apollo still uses legacy adminTasks(search, id). Showing that list.',
    }
  } catch (error) {
    if (!isMissingAdminFieldError(error)) throw error
  }

  const result = await apolloClient.query<TasksQuery>({
    query: Tasks,
    variables: query.trim() ? { filter: { search: query.trim() } } : {},
    fetchPolicy: 'network-only',
  })
  return {
    rows: result.data?.tasks ?? [],
    banner:
      'BE-42 adminTasks is not on this Apollo yet. Showing public marketplace tasks instead.',
  }
}

async function listUsers(query: string): Promise<{
  rows: UserHit[]
  banner: string | null
}> {
  try {
    const result = await apolloClient.query<AdminUsersQuery>({
      query: AdminUsers,
      variables: toAdminUserListVariables(query),
      fetchPolicy: 'network-only',
    })
    return { rows: result.data?.adminUsers ?? [], banner: null }
  } catch (error) {
    if (!isMissingAdminFieldError(error)) throw error
    throw new Error(
      'adminUsers is not on this Apollo yet (BE-43). Point NEXT_PUBLIC_GRAPHQL_URL at an API that has the @admin user search.',
    )
  }
}
