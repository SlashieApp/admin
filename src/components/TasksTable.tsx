'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { DataTable, type DataColumn } from '@/components/DataTable'
import { FilterToolbar } from '@/components/FilterToolbar'
import { TablePager } from '@/components/TablePager'
import { AdminTasks, Tasks } from '@/graphql/operations'
import { apolloClient } from '@/lib/apollo'
import { displayName, formatMoney } from '@/lib/dossier'
import {
  graphqlErrorMessage,
  isMissingAdminFieldError,
} from '@/lib/graphqlErrors'
import {
  bboxEquals,
  nextDeniedFilterKeys,
  presentProposedFilterKeys,
  PROPOSED_ADMIN_TASK_FILTER_KEYS,
  type GeoBBox,
} from '@/lib/geo'
import { nextSort } from '@/lib/listParams'
import { pinsFromTasks } from '@/lib/taskMapPins'
import {
  refineTasks,
  TASK_BUDGET_TYPES,
  TASK_CATEGORIES,
  TASK_STATUSES,
  taskFiltersFromForm,
  taskListPath,
  taskPageLocalNotice,
  parseTaskListFilters,
  toTaskListQueryVariables,
  type TaskListFilters,
  type TaskListRow,
} from '@/lib/taskList'
import type { AdminTasksQuery, TasksQuery } from '@codegen/schema'

const TasksMap = dynamic(
  () => import('@/components/TasksMap').then((mod) => mod.TasksMap),
  {
    ssr: false,
    loading: () => (
      <div className="ops-map">
        <p className="muted card-pad">Loading map…</p>
      </div>
    ),
  },
)

type TaskHit = AdminTasksQuery['adminTasks'][number]

const deniedAdminTaskFilterKeys = new Set<string>()

export function TasksTable() {
  const params = useSearchParams()
  const router = useRouter()
  const filters = useMemo(() => parseTaskListFilters(params), [params])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [rows, setRows] = useState<TaskHit[]>([])
  const [bbox, setBbox] = useState<GeoBBox | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [denyKeys, setDenyKeys] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setBusy(true)
      setError(null)
      setBanner(null)
      try {
        const result = await listTasks(filters, bbox)
        if (cancelled) return
        setRows(result.rows)
        setBanner(result.banner)
        setDenyKeys([...deniedAdminTaskFilterKeys])
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
  }, [filters, bbox])

  function go(next: Partial<TaskListFilters>) {
    router.push(taskListPath({ ...filters, ...next }))
  }

  const visible = refineTasks(rows, filters)
  const localNotice = taskPageLocalNotice(filters, denyKeys)
  const truncated = !busy && rows.length >= filters.first
  const pins = pinsFromTasks(visible)
  const bboxSupported = Boolean(bbox) && !denyKeys.includes('bbox')
  const bboxBlocked = denyKeys.includes('bbox')

  function selectTask(id: string) {
    setSelectedId(id)
    const node =
      document.getElementById(`task-row-${id}`) ??
      document.getElementById(`task-card-${id}`)
    node?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  function onUserBBox(next: GeoBBox) {
    if (deniedAdminTaskFilterKeys.has('bbox')) return
    setBbox((current) => (bboxEquals(current, next) ? current : next))
  }

  const columns: DataColumn<TaskHit>[] = [
    {
      key: 'title',
      header: 'Title',
      sortKey: 'title',
      render: (task) => (
        <Link href={`/tasks/${task.id}`} className="table-link">
          {task.title}
        </Link>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortKey: 'status',
      render: (task) => <span className="pill">{task.status}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      sortKey: 'category',
      render: (task) => task.category,
    },
    {
      key: 'poster',
      header: 'Poster',
      sortKey: 'poster',
      render: (task) => (
        <>
          {task.poster ? (
            <Link href={`/users/${task.poster.id}`} className="table-link">
              {displayName(task.poster)}
            </Link>
          ) : (
            '—'
          )}
          {task.poster?.email ? (
            <span className="meta"> · {task.poster.email}</span>
          ) : null}
        </>
      ),
    },
    {
      key: 'budget',
      header: 'Budget',
      sortKey: 'budget',
      render: (task) => (
        <>
          {formatMoney(task.budget?.amount, task.budget?.currency)}
          {task.budget?.type ? (
            <span className="meta"> · {task.budget.type}</span>
          ) : null}
        </>
      ),
    },
    {
      key: 'visibility',
      header: 'Visibility',
      sortKey: 'visibility',
      render: (task) =>
        task.hidden ? (
          <span className="pill pill-warn">hidden</span>
        ) : (
          <span className="pill">public</span>
        ),
    },
    {
      key: 'date',
      header: 'Job date',
      sortKey: 'date',
      render: (task) => task.datetime?.date || '—',
    },
    {
      key: 'views',
      header: 'Views',
      sortKey: 'views',
      render: (task) => task.views ?? '—',
    },
  ]

  return (
    <section className="stack">
      <div className="page-intro">
        <h1>Tasks</h1>
        <p className="muted">
          Marketplace tasks with shareable filters and an ops map. Search,
          status, and visibility go to <code>adminTasks</code>. Pan the map to
          load the visible area when{' '}
          <a
            className="inline-link"
            href="https://linear.app/slashie/issue/BE-49/admin-api-cursor-pages-richer-filters-for-admintasksadminusersinbox"
          >
            BE-49
          </a>{' '}
          bbox is on Apollo.
        </p>
      </div>

      <FilterToolbar
        key={taskListPath({ ...filters, sort: '', dir: 'desc' })}
        busy={busy}
        onSubmit={(event) => {
          event.preventDefault()
          go(taskFiltersFromForm(new FormData(event.currentTarget), filters))
        }}
        onClear={() => router.push('/')}
      >
        <label className="field field-wide">
          Title / id
          <input
            className="input search-input"
            name="q"
            defaultValue={filters.q}
            placeholder="Task title, description, or id"
            type="search"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <label className="field">
          Status
          <select className="input" name="status" defaultValue={filters.status}>
            <option value="ALL">All statuses</option>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Category
          <input
            className="input"
            name="category"
            list="task-category-options"
            defaultValue={filters.category}
            placeholder="Any category"
          />
          <datalist id="task-category-options">
            {TASK_CATEGORIES.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </label>
        <label className="field">
          Poster
          <input
            className="input"
            name="poster"
            defaultValue={filters.poster}
            placeholder="Name, email, or id"
          />
        </label>
        <label className="field">
          Budget min
          <input
            className="input"
            name="budgetMin"
            type="number"
            min={0}
            defaultValue={filters.budgetMin ?? ''}
          />
        </label>
        <label className="field">
          Budget max
          <input
            className="input"
            name="budgetMax"
            type="number"
            min={0}
            defaultValue={filters.budgetMax ?? ''}
          />
        </label>
        <label className="field">
          Budget type
          <select
            className="input"
            name="budgetType"
            defaultValue={filters.budgetType}
          >
            <option value="ALL">Any type</option>
            {TASK_BUDGET_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Visibility
          <select
            className="input"
            name="visibility"
            defaultValue={filters.visibility}
          >
            <option value="all">All</option>
            <option value="public">Public</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
        <label className="field">
          Job date from
          <input
            className="input"
            name="from"
            type="date"
            defaultValue={filters.from}
          />
        </label>
        <label className="field">
          Job date to
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
      {bboxBlocked ? (
        <p className="banner banner-warn">
          Map pins show this server page. Area browse (pan/zoom bbox) needs{' '}
          <a
            className="inline-link"
            href="https://linear.app/slashie/issue/BE-49/admin-api-cursor-pages-richer-filters-for-admintasksadminusersinbox"
          >
            BE-49
          </a>
          .
        </p>
      ) : null}
      {bboxSupported ? (
        <p className="banner banner-ok">
          Showing tasks in the visible map area
          {pins.length !== visible.length
            ? ` · ${pins.length} of ${visible.length} have coordinates`
            : ''}
          .
        </p>
      ) : null}
      {truncated ? (
        <p className="banner banner-warn">
          Showing the first {filters.first} matching server rows.{' '}
          <code>adminTasks</code> has no cursor yet —{' '}
          <a
            className="inline-link"
            href="https://linear.app/slashie/issue/BE-49/admin-api-cursor-pages-richer-filters-for-admintasksadminusersinbox"
          >
            BE-49
          </a>
          .
        </p>
      ) : null}
      {error ? <p className="banner banner-error">{error}</p> : null}

      <TasksMap
        pins={pins}
        selectedId={selectedId}
        onSelect={selectTask}
        onOpen={(id) => router.push(`/tasks/${id}`)}
        onUserBBox={onUserBBox}
        lockCamera={Boolean(bbox)}
      />

      <DataTable
        rows={visible}
        columns={columns}
        rowKey={(task) => task.id}
        selectedKey={selectedId}
        onRowClick={(task) => setSelectedId(task.id)}
        sort={filters.sort}
        dir={filters.dir}
        onSort={(key) => go(nextSort(filters.sort, filters.dir, key))}
        loading={busy}
        empty="No tasks for this filter."
        renderCard={(task) => <TaskCard task={task} />}
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

function TaskCard({ task }: { task: TaskListRow }) {
  return (
    <>
      <div className="card-top">
        <Link href={`/tasks/${task.id}`} className="table-link">
          {task.title}
        </Link>
        <span className="pill">{task.status}</span>
      </div>
      <p className="meta">
        {task.category}
        {task.poster ? ` · ${displayName(task.poster)}` : ''}
        {` · ${formatMoney(task.budget?.amount, task.budget?.currency)}`}
      </p>
    </>
  )
}

async function listTasks(
  filters: TaskListFilters,
  bbox: GeoBBox | null,
): Promise<{
  rows: TaskHit[]
  banner: string | null
}> {
  let denyKeys = [...deniedAdminTaskFilterKeys]
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const vars = toTaskListQueryVariables(filters, { bbox, denyKeys })
    try {
      const result = await apolloClient.query<AdminTasksQuery>({
        query: AdminTasks,
        variables: vars,
        fetchPolicy: 'network-only',
      })
      for (const key of denyKeys) deniedAdminTaskFilterKeys.add(key)
      return { rows: result.data?.adminTasks ?? [], banner: null }
    } catch (error) {
      if (!isMissingAdminFieldError(error)) throw error
      const present = presentProposedFilterKeys(
        (vars.filter ?? {}) as Record<string, unknown>,
      )
      if (present.length === 0) break
      const next = nextDeniedFilterKeys(
        present,
        graphqlErrorMessage(error),
        denyKeys,
      )
      if (next.length === denyKeys.length) break
      denyKeys = next
    }
  }

  const vars = toTaskListQueryVariables(filters, {
    denyKeys: PROPOSED_ADMIN_TASK_FILTER_KEYS,
  })
  try {
    const result = await apolloClient.query<AdminTasksQuery>({
      query: AdminTasks,
      variables: vars,
      fetchPolicy: 'network-only',
    })
    for (const key of PROPOSED_ADMIN_TASK_FILTER_KEYS) {
      deniedAdminTaskFilterKeys.add(key)
    }
    return { rows: result.data?.adminTasks ?? [], banner: null }
  } catch (error) {
    if (!isMissingAdminFieldError(error)) throw error
  }

  const result = await apolloClient.query<TasksQuery>({
    query: Tasks,
    variables: filters.q.trim() ? { filter: { search: filters.q.trim() } } : {},
    fetchPolicy: 'network-only',
  })
  return {
    rows: result.data?.tasks ?? [],
    banner:
      'BE-42 adminTasks is not on this Apollo yet. Showing public marketplace tasks instead.',
  }
}
