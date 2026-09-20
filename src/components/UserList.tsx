'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { DataTable } from '@/components/ops/DataTable'
import { DraftFilters, FilterField, FilterToolbar } from '@/components/ops/FilterToolbar'
import { PaginationBar } from '@/components/ops/PaginationBar'
import { AdminUsers } from '@/graphql/operations'
import { apolloClient } from '@/lib/apollo'
import { displayName, formatWhen } from '@/lib/dossier'
import {
  graphqlErrorMessage,
  isMissingAdminFieldError,
} from '@/lib/graphqlErrors'
import { type PageSize } from '@/lib/listQuery'
import { isWorkerUser } from '@/lib/userInput'
import {
  applyUserClientFilters,
  parseUserListFilters,
  sortUserRows,
  toAdminUserListVariablesFromFilters,
  userClientFilterActive,
  userListPath,
  type UserListFilters,
} from '@/lib/userList'
import type { AdminUsersQuery } from '@codegen/schema'

type UserHit = AdminUsersQuery['adminUsers'][number]

const USER_COLUMNS = [
  { key: 'name', label: 'Name', sortKey: 'name' },
  { key: 'email', label: 'Email', sortKey: 'email' },
  { key: 'role', label: 'Role' },
  { key: 'verified', label: 'Verified' },
  { key: 'status', label: 'Status', sortKey: 'status' },
  { key: 'createdAt', label: 'Created', sortKey: 'createdAt' },
]

const CLIENT_FILTER_NOTE =
  'Email, name, disabled, worker, and date filter this API page only. adminUsers has search/id + first — no after cursor or those extra args yet.'

export function UserList() {
  const params = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const filters = useMemo(() => parseUserListFilters(params), [params])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [rows, setRows] = useState<UserHit[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setBusy(true)
      setError(null)
      setBanner(null)
      try {
        const hits = await listUsers(filters)
        if (cancelled) return
        setRows(hits.rows)
        setBanner(hits.banner)
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

  const visible = useMemo(() => {
    return sortUserRows(applyUserClientFilters(rows, filters), filters)
  }, [rows, filters])

  function go(next: UserListFilters) {
    router.replace(userListPath(next, pathname))
  }

  return (
    <section className="stack">
      <div className="page-intro">
        <h1>Users</h1>
        <p className="muted">
          Marketplace users. Server search is email, name, or id. Disabled and
          worker flags filter the current API page.
        </p>
      </div>

      <DraftFilters key={userListPath(filters, pathname)} value={filters}>
        {(draft, setDraft) => (
      <FilterToolbar
        onSubmit={(event) => {
          event.preventDefault()
          go(draft)
        }}
        onClearHref={pathname.startsWith('/users') ? '/users' : '/?mode=users'}
        busy={busy}
        note={CLIENT_FILTER_NOTE}
      >
        <FilterField label="Search">
          <input
            className="input search-input"
            value={draft.q}
            onChange={(e) => setDraft({ ...draft, q: e.target.value })}
            placeholder="Email, name, or user id"
            type="search"
            autoComplete="off"
            spellCheck={false}
          />
        </FilterField>
        <FilterField label="Email">
          <input
            className="input"
            value={draft.email}
            onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            placeholder="Contains…"
          />
        </FilterField>
        <FilterField label="Name">
          <input
            className="input"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Contains…"
          />
        </FilterField>
        <FilterField label="Account">
          <select
            className="input"
            value={draft.disabled}
            onChange={(e) =>
              setDraft({
                ...draft,
                disabled: parseUserListFilters(
                  new URLSearchParams(`disabled=${e.target.value}`),
                ).disabled,
              })
            }
          >
            <option value="all">All</option>
            <option value="no">Active</option>
            <option value="yes">Disabled</option>
          </select>
        </FilterField>
        <FilterField label="Worker">
          <select
            className="input"
            value={draft.worker}
            onChange={(e) =>
              setDraft({
                ...draft,
                worker: parseUserListFilters(
                  new URLSearchParams(`worker=${e.target.value}`),
                ).worker,
              })
            }
          >
            <option value="all">All</option>
            <option value="yes">Workers</option>
            <option value="no">Not workers</option>
          </select>
        </FilterField>
        <FilterField label="Created from">
          <input
            className="input"
            type="date"
            value={draft.from}
            onChange={(e) => setDraft({ ...draft, from: e.target.value })}
          />
        </FilterField>
        <FilterField label="Created to">
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
      {busy ? <p className="muted">Loading users…</p> : null}

      {!busy && !error ? (
        <DataTable
          caption="Users"
          columns={USER_COLUMNS}
          rows={visible}
          sort={filters.sort}
          dir={filters.dir}
          onSort={(sort, dir) => go({ ...filters, sort, dir })}
          empty="No users found."
          render={(user, key) => {
            if (key === 'name') {
              return (
                <Link href={`/users/${user.id}`} className="table-link">
                  {displayName(user)}
                </Link>
              )
            }
            if (key === 'email') return user.email
            if (key === 'role') {
              return isWorkerUser(user) ? (
                <span className="pill pill-ok">worker</span>
              ) : (
                <span className="pill">not a worker</span>
              )
            }
            if (key === 'verified') {
              return (
                <>
                  {user.emailVerified ? 'Email' : 'Email unverified'}
                  {user.phoneVerified ? ' · Phone' : ''}
                </>
              )
            }
            if (key === 'status') {
              return user.disabled ? (
                <span className="pill pill-warn">disabled</span>
              ) : (
                <span className="pill pill-ok">active</span>
              )
            }
            return formatWhen(user.createdAt)
          }}
        />
      ) : null}

      <PaginationBar
        shownCount={visible.length}
        fetchedCount={rows.length}
        pageSize={filters.first}
        filtered={userClientFilterActive(filters)}
        onPageSize={(first: PageSize) => go({ ...filters, first })}
        canPrev={false}
        canNext={false}
        nextDisabledReason="Next page needs an after cursor on adminUsers. Showing this first-N API page only — see the BE follow-up."
      />
    </section>
  )
}

async function listUsers(filters: UserListFilters): Promise<{
  rows: UserHit[]
  banner: string | null
}> {
  try {
    const result = await apolloClient.query<AdminUsersQuery>({
      query: AdminUsers,
      variables: toAdminUserListVariablesFromFilters(filters),
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
