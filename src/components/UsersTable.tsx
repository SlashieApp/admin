'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { DataTable, type DataColumn } from '@/components/DataTable'
import { FilterToolbar } from '@/components/FilterToolbar'
import { TablePager } from '@/components/TablePager'
import { AdminUsers } from '@/graphql/operations'
import { apolloClient } from '@/lib/apollo'
import { displayName, formatWhen } from '@/lib/dossier'
import {
  graphqlErrorMessage,
  isMissingAdminFieldError,
} from '@/lib/graphqlErrors'
import { nextSort } from '@/lib/listParams'
import { isWorkerUser } from '@/lib/userInput'
import {
  parseUserListFilters,
  refineUsers,
  toUserListQueryVariables,
  userFiltersFromForm,
  userListPath,
  userPageLocalNotice,
  type UserListFilters,
  type UserListRow,
} from '@/lib/userList'
import type { AdminUsersQuery } from '@codegen/schema'

type UserHit = AdminUsersQuery['adminUsers'][number]

export function UsersTable() {
  const params = useSearchParams()
  const router = useRouter()
  const filters = useMemo(() => parseUserListFilters(params), [params])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<UserHit[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setBusy(true)
      setError(null)
      try {
        const result = await listUsers(filters)
        if (cancelled) return
        setRows(result)
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
  }, [filters])

  function go(next: Partial<UserListFilters>) {
    router.push(userListPath({ ...filters, ...next }))
  }

  const visible = refineUsers(rows, filters)
  const localNotice = userPageLocalNotice(filters)
  const truncated = !busy && rows.length >= filters.first

  const columns: DataColumn<UserHit>[] = [
    {
      key: 'name',
      header: 'Name',
      sortKey: 'name',
      render: (user) => (
        <Link href={`/users/${user.id}`} className="table-link">
          {displayName(user)}
        </Link>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortKey: 'email',
      render: (user) => user.email,
    },
    {
      key: 'role',
      header: 'Role',
      sortKey: 'role',
      render: (user) =>
        isWorkerUser(user) ? (
          <span className="pill pill-ok">worker</span>
        ) : (
          <span className="pill">not a worker</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      sortKey: 'status',
      render: (user) =>
        user.disabled ? (
          <span className="pill pill-warn">disabled</span>
        ) : (
          <span className="pill pill-ok">active</span>
        ),
    },
    {
      key: 'created',
      header: 'Created',
      sortKey: 'created',
      render: (user) => formatWhen(user.createdAt),
    },
  ]

  return (
    <section className="stack">
      <div className="page-intro">
        <h1>Users</h1>
        <p className="muted">
          Search marketplace users by email, name, or id. Disabled, worker, and
          created-date filters refine the current <code>adminUsers</code> page.
        </p>
      </div>

      <FilterToolbar
        key={userListPath({ ...filters, sort: '', dir: 'desc' })}
        busy={busy}
        onSubmit={(event) => {
          event.preventDefault()
          go(userFiltersFromForm(new FormData(event.currentTarget), filters))
        }}
        onClear={() => router.push('/users')}
      >
        <label className="field field-wide">
          Search
          <input
            className="input search-input"
            name="q"
            defaultValue={filters.q}
            placeholder="Email, name, or user id"
            type="search"
            autoComplete="off"
            spellCheck={false}
          />
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
          Name
          <input
            className="input"
            name="name"
            defaultValue={filters.name}
            placeholder="Contains…"
          />
        </label>
        <label className="field">
          Account
          <select className="input" name="disabled" defaultValue={filters.disabled}>
            <option value="all">Active + disabled</option>
            <option value="no">Active</option>
            <option value="yes">Disabled</option>
          </select>
        </label>
        <label className="field">
          Worker
          <select className="input" name="worker" defaultValue={filters.worker}>
            <option value="all">Any</option>
            <option value="yes">Workers</option>
            <option value="no">Not workers</option>
          </select>
        </label>
        <label className="field">
          Created from
          <input
            className="input"
            name="from"
            type="date"
            defaultValue={filters.from}
          />
        </label>
        <label className="field">
          Created to
          <input
            className="input"
            name="to"
            type="date"
            defaultValue={filters.to}
          />
        </label>
      </FilterToolbar>

      {localNotice ? <p className="banner banner-warn">{localNotice}</p> : null}
      {truncated ? (
        <p className="banner banner-warn">
          Showing the first {filters.first} matching server rows.{' '}
          <code>adminUsers</code> has no cursor yet —{' '}
          <a
            className="inline-link"
            href="https://linear.app/slashie/issue/BE-50/admin-api-cursor-pagination-richer-filters-for-tasks-users-feedback"
          >
            BE-50
          </a>
          .
        </p>
      ) : null}
      {error ? <p className="banner banner-error">{error}</p> : null}

      <DataTable
        rows={visible}
        columns={columns}
        rowKey={(user) => user.id}
        sort={filters.sort}
        dir={filters.dir}
        onSort={(key) => go(nextSort(filters.sort, filters.dir, key))}
        loading={busy}
        empty="No users for this filter."
        renderCard={(user) => <UserCard user={user} />}
        footer={
          <TablePager
            shown={visible.length}
            fetched={rows.length}
            pageSize={filters.first}
            onPageSize={(first) => go({ first })}
            note={truncated ? 'end of this request' : null}
          />
        }
      />
    </section>
  )
}

function UserCard({ user }: { user: UserListRow }) {
  return (
    <>
      <div className="card-top">
        <Link href={`/users/${user.id}`} className="table-link">
          {displayName(user)}
        </Link>
        {user.disabled ? (
          <span className="pill pill-warn">disabled</span>
        ) : (
          <span className="pill pill-ok">active</span>
        )}
      </div>
      <p className="meta">
        {user.email}
        {isWorkerUser(user) ? ' · worker' : ''}
      </p>
    </>
  )
}

async function listUsers(filters: UserListFilters): Promise<UserHit[]> {
  try {
    const result = await apolloClient.query<AdminUsersQuery>({
      query: AdminUsers,
      variables: toUserListQueryVariables(filters),
      fetchPolicy: 'network-only',
    })
    return result.data?.adminUsers ?? []
  } catch (error) {
    if (!isMissingAdminFieldError(error)) throw error
    throw new Error(
      'adminUsers is not on this Apollo yet (BE-43). Point NEXT_PUBLIC_GRAPHQL_URL at an API that has the @admin user search.',
    )
  }
}
