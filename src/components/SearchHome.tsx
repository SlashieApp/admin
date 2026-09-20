'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { AdminTasks, AdminUsers, Tasks } from '@/graphql/operations'
import { apolloClient } from '@/lib/apollo'
import {
  graphqlErrorMessage,
  isMissingAdminFieldError,
} from '@/lib/graphqlErrors'
import {
  parseAdminHomeMode,
  toAdminTaskListVariables,
  toAdminUserListVariables,
} from '@/lib/search'
import { displayName, formatMoney } from '@/lib/dossier'
import { isWorkerUser } from '@/lib/userInput'
import type {
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

      <form className="search-row" onSubmit={onSubmit}>
        <label className="field">
          {mode === 'users' ? 'Search users' : 'Search tasks'}
          <input
            className="input search-input"
            value={q}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={
              mode === 'users'
                ? 'Email, name, or user id'
                : 'Task title, description, or id'
            }
            type="search"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Loading…' : 'Search'}
        </button>
      </form>

      {banner ? <p className="banner banner-warn">{banner}</p> : null}
      {error ? <p className="banner banner-error">{error}</p> : null}

      {mode === 'users' && users.length > 0 ? (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Verified</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <Link href={`/users/${user.id}`} className="table-link">
                      {displayName(user)}
                    </Link>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    {isWorkerUser(user) ? (
                      <span className="pill pill-ok">worker</span>
                    ) : (
                      <span className="pill">not a worker</span>
                    )}
                  </td>
                  <td>
                    {user.emailVerified ? 'Email' : 'Email unverified'}
                    {user.phoneVerified ? ' · Phone' : ''}
                  </td>
                  <td>
                    {user.disabled ? (
                      <span className="pill pill-warn">disabled</span>
                    ) : (
                      <span className="pill pill-ok">active</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : mode === 'tasks' && tasks.length > 0 ? (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Category</th>
                <th>Poster</th>
                <th>Budget</th>
                <th>Visibility</th>
                <th>Views</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>
                    <Link href={`/tasks/${task.id}`} className="table-link">
                      {task.title}
                    </Link>
                  </td>
                  <td>
                    <span className="pill">{task.status}</span>
                  </td>
                  <td>{task.category}</td>
                  <td>
                    {task.poster ? displayName(task.poster) : '—'}
                    {task.poster?.email ? (
                      <span className="meta"> · {task.poster.email}</span>
                    ) : null}
                  </td>
                  <td>
                    {formatMoney(task.budget?.amount, task.budget?.currency)}
                  </td>
                  <td>
                    {task.hidden ? (
                      <span className="pill pill-warn">hidden</span>
                    ) : (
                      <span className="pill">public</span>
                    )}
                  </td>
                  <td>{task.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

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
