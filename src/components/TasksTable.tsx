'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { DataTable, type DataColumn } from '@/components/DataTable'
import { FilterToolbar } from '@/components/FilterToolbar'
import { TablePager } from '@/components/TablePager'
import { AdminTasks, PopularTaskCategories } from '@/graphql/operations'
import { apolloClient } from '@/lib/apollo'
import { displayName, formatMoney } from '@/lib/dossier'
import { bboxesEqual, taskCoordinates } from '@/lib/geo'
import { graphqlErrorMessage } from '@/lib/graphqlErrors'
import { nextSort } from '@/lib/listParams'
import {
  isTaskSuspended,
  suspensionReason,
  type TaskSuspensionLike,
} from '@/lib/suspension'
import {
  sortTasks,
  TASK_BUDGET_TYPES,
  TASK_STATUSES,
  taskFiltersFromForm,
  taskListPath,
  parseTaskListFilters,
  toTaskListQueryVariables,
  type TaskListFilters,
  type TaskListRow,
} from '@/lib/taskList'
import type {
  AdminTasksQuery,
  PopularTaskCategoriesQuery,
} from '@codegen/schema'

const TasksMap = dynamic(
  () => import('@/components/TasksMap').then((mod) => mod.TasksMap),
  {
    ssr: false,
    loading: () => (
      <div className="tasks-map tasks-map-placeholder">Loading map…</div>
    ),
  },
)

type TaskHit = AdminTasksQuery['adminTasks']['items'][number]

export function TasksTable() {
  const params = useSearchParams()
  const router = useRouter()
  const filters = useMemo(() => parseTaskListFilters(params), [params])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<TaskHit[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [cursorStack, setCursorStack] = useState<string[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])

  // Categories are open text (BE-79), so suggest the ones tasks use most.
  useEffect(() => {
    let cancelled = false
    apolloClient
      .query<PopularTaskCategoriesQuery>({
        query: PopularTaskCategories,
        variables: { first: 30 },
      })
      .then((result) => {
        if (!cancelled) setCategoryOptions(result.data?.popularTaskCategories ?? [])
      })
      // Suggestions only: the filter still takes any text.
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setBusy(true)
      setError(null)
      try {
        const result = await apolloClient.query<AdminTasksQuery>({
          query: AdminTasks,
          variables: toTaskListQueryVariables(filters),
          fetchPolicy: 'network-only',
        })
        if (cancelled) return
        setRows(result.data?.adminTasks.items ?? [])
        setNextCursor(result.data?.adminTasks.nextCursor ?? null)
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

  function go(next: Partial<TaskListFilters>, keepAfter = false) {
    const merged = { ...filters, ...next }
    if (!keepAfter && next.after === undefined) merged.after = ''
    router.push(taskListPath(merged))
  }

  const visible = sortTasks(rows, filters)
  const pins = useMemo(
    () =>
      visible.flatMap((task) => {
        const point = taskCoordinates(task.location)
        if (!point) return []
        return [
          {
            id: task.id,
            title: task.title,
            status: task.status,
            lat: point.lat,
            lng: point.lng,
          },
        ]
      }),
    [visible],
  )

  useEffect(() => {
    if (!selectedId) return
    document
      .querySelector('tr.is-selected, .data-card.is-selected')
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedId, visible])

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
      render: (task) => task.categories.join(', '),
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
      key: 'suspended',
      header: 'Suspended',
      sortKey: 'suspended',
      render: (task) => <SuspensionCell suspension={task.suspension} />,
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
          Marketplace tasks with shareable filters and a Mapbox pin map. Pan or
          zoom the map to browse an area.
        </p>
      </div>

      <FilterToolbar
        key={taskListPath({ ...filters, sort: '', dir: 'desc' })}
        busy={busy}
        onSubmit={(event) => {
          event.preventDefault()
          setCursorStack([])
          go(taskFiltersFromForm(new FormData(event.currentTarget), filters))
        }}
        onClear={() => {
          setCursorStack([])
          router.push('/')
        }}
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
            {categoryOptions.map((category) => (
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
          Suspended
          <select
            className="input"
            name="suspended"
            defaultValue={filters.suspended}
          >
            <option value="all">Any</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
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

      {error ? <p className="banner banner-error">{error}</p> : null}

      <TasksMap
        pins={pins}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onOpen={(id) => router.push(`/tasks/${id}`)}
        initialBbox={filters.bbox}
        onBboxChange={(bbox) => {
          if (bboxesEqual(bbox, filters.bbox)) return
          setCursorStack([])
          router.replace(taskListPath({ ...filters, bbox, after: '' }))
        }}
      />

      <DataTable
        rows={visible}
        columns={columns}
        rowKey={(task) => task.id}
        sort={filters.sort}
        dir={filters.dir}
        onSort={(key) => go(nextSort(filters.sort, filters.dir, key), true)}
        loading={busy}
        empty="No tasks for this filter."
        selectedKey={selectedId}
        onRowSelect={(task) => setSelectedId(task.id)}
        renderCard={(task) => <TaskCard task={task} />}
        footer={
          <TablePager
            shown={visible.length}
            fetched={rows.length}
            pageSize={filters.first}
            hasNext={Boolean(nextCursor)}
            hasPrev={Boolean(filters.after)}
            onPageSize={(first) => {
              setCursorStack([])
              go({ first })
            }}
            onNext={() => {
              if (!nextCursor) return
              setCursorStack((stack) => [...stack, filters.after])
              go({ after: nextCursor }, true)
            }}
            onPrev={() => {
              const prev = cursorStack.at(-1) ?? ''
              setCursorStack((stack) => stack.slice(0, -1))
              go({ after: prev }, true)
            }}
            onFirst={() => {
              setCursorStack([])
              go({})
            }}
          />
        }
      />
    </section>
  )
}

/** Table cell: a Suspended pill with the reason (by Slashie, poster's account), or No. */
function SuspensionCell({ suspension }: { suspension: TaskSuspensionLike }) {
  if (!isTaskSuspended(suspension)) return <span className="muted">No</span>
  return (
    <>
      <span className="pill pill-warn">Suspended</span>
      <span className="meta"> · {suspensionReason(suspension)}</span>
    </>
  )
}

function TaskCard({ task }: { task: TaskListRow }) {
  const suspended = isTaskSuspended(task.suspension)
  return (
    <>
      <div className="card-top">
        <Link href={`/tasks/${task.id}`} className="table-link">
          {task.title}
        </Link>
        <span className="pills">
          {suspended ? <span className="pill pill-warn">Suspended</span> : null}
          <span className="pill">{task.status}</span>
        </span>
      </div>
      <p className="meta">
        {task.categories.join(', ')}
        {task.poster ? ` · ${displayName(task.poster)}` : ''}
        {` · ${formatMoney(task.budget?.amount, task.budget?.currency)}`}
      </p>
      {suspended ? (
        <p className="meta">Suspended {suspensionReason(task.suspension)}</p>
      ) : null}
    </>
  )
}
