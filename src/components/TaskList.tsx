'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { DataTable } from '@/components/ops/DataTable'
import { DraftFilters, FilterField, FilterToolbar } from '@/components/ops/FilterToolbar'
import { PaginationBar } from '@/components/ops/PaginationBar'
import { AdminTasks, Tasks } from '@/graphql/operations'
import { apolloClient } from '@/lib/apollo'
import { displayName, formatMoney } from '@/lib/dossier'
import {
  graphqlErrorMessage,
  isMissingAdminFieldError,
} from '@/lib/graphqlErrors'
import { type PageSize } from '@/lib/listQuery'
import { TASK_CATEGORIES, TASK_STATUSES } from '@/lib/taskInput'
import {
  applyTaskClientFilters,
  parseTaskListFilters,
  sortTaskRows,
  taskClientFilterActive,
  taskListPath,
  toAdminTaskListVariablesFromFilters,
  type TaskListFilters,
} from '@/lib/taskList'
import { TaskBudgetType } from '@codegen/schema'
import type { AdminTasksQuery, TasksQuery } from '@codegen/schema'

type TaskHit = AdminTasksQuery['adminTasks'][number] & {
  datetime?: { date?: string | null } | null
}

const TASK_COLUMNS = [
  { key: 'title', label: 'Title', sortKey: 'title' },
  { key: 'status', label: 'Status', sortKey: 'status' },
  { key: 'category', label: 'Category', sortKey: 'category' },
  { key: 'poster', label: 'Poster', sortKey: 'poster' },
  { key: 'budget', label: 'Budget', sortKey: 'budget' },
  { key: 'visibility', label: 'Visibility' },
  { key: 'views', label: 'Views', sortKey: 'views' },
]

const CLIENT_FILTER_NOTE =
  'Category, poster, budget, and date filter this API page only. adminTasks has search/id/status/hidden + first — no after cursor, category, poster, budget, or dates yet.'

export function TaskList() {
  const params = useSearchParams()
  const router = useRouter()
  const filters = useMemo(() => parseTaskListFilters(params), [params])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [rows, setRows] = useState<TaskHit[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setBusy(true)
      setError(null)
      setBanner(null)
      try {
        const hits = await listTasks(filters)
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
    return sortTaskRows(applyTaskClientFilters(rows, filters), filters)
  }, [rows, filters])

  function go(next: TaskListFilters) {
    router.replace(taskListPath(next))
  }

  return (
    <section className="stack">
      <div className="page-intro">
        <h1>Tasks</h1>
        <p className="muted">
          Marketplace tasks. Server filters: title/id search, status, hidden.
          Other filters apply to the current API page.
        </p>
      </div>

      <DraftFilters key={taskListPath(filters)} value={filters}>
        {(draft, setDraft) => (
      <FilterToolbar
        onSubmit={(event) => {
          event.preventDefault()
          go(draft)
        }}
        onClearHref="/"
        busy={busy}
        note={CLIENT_FILTER_NOTE}
      >
        <FilterField label="Title / id">
          <input
            className="input search-input"
            value={draft.q}
            onChange={(e) => setDraft({ ...draft, q: e.target.value })}
            placeholder="Task title, description, or id"
            type="search"
            autoComplete="off"
            spellCheck={false}
          />
        </FilterField>
        <FilterField label="Status">
          <select
            className="input"
            value={draft.status}
            onChange={(e) =>
              setDraft({
                ...draft,
                status: parseTaskListFilters(
                  new URLSearchParams(`status=${e.target.value}`),
                ).status,
              })
            }
          >
            <option value="">All statuses</option>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Category">
          <input
            className="input"
            list="task-category-options"
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            placeholder="Any category"
          />
          <datalist id="task-category-options">
            {TASK_CATEGORIES.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </FilterField>
        <FilterField label="Poster">
          <input
            className="input"
            value={draft.poster}
            onChange={(e) => setDraft({ ...draft, poster: e.target.value })}
            placeholder="Name, email, or id"
          />
        </FilterField>
        <FilterField label="Budget min">
          <input
            className="input"
            type="number"
            min="0"
            step="1"
            value={draft.budgetMin ?? ''}
            onChange={(e) =>
              setDraft({
                ...draft,
                budgetMin: e.target.value === '' ? undefined : Number(e.target.value),
              })
            }
          />
        </FilterField>
        <FilterField label="Budget max">
          <input
            className="input"
            type="number"
            min="0"
            step="1"
            value={draft.budgetMax ?? ''}
            onChange={(e) =>
              setDraft({
                ...draft,
                budgetMax: e.target.value === '' ? undefined : Number(e.target.value),
              })
            }
          />
        </FilterField>
        <FilterField label="Budget type">
          <select
            className="input"
            value={draft.budgetType}
            onChange={(e) =>
              setDraft({
                ...draft,
                budgetType: parseTaskListFilters(
                  new URLSearchParams(`budgetType=${e.target.value}`),
                ).budgetType,
              })
            }
          >
            <option value="">Any type</option>
            {Object.values(TaskBudgetType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Visibility">
          <select
            className="input"
            value={draft.hidden}
            onChange={(e) =>
              setDraft({
                ...draft,
                hidden: parseTaskListFilters(
                  new URLSearchParams(`hidden=${e.target.value}`),
                ).hidden,
              })
            }
          >
            <option value="all">All</option>
            <option value="no">Public</option>
            <option value="yes">Hidden</option>
          </select>
        </FilterField>
        <FilterField label="Date from">
          <input
            className="input"
            type="date"
            value={draft.from}
            onChange={(e) => setDraft({ ...draft, from: e.target.value })}
          />
        </FilterField>
        <FilterField label="Date to">
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
      {busy ? <p className="muted">Loading tasks…</p> : null}

      {!busy && !error ? (
        <DataTable
          caption="Tasks"
          columns={TASK_COLUMNS}
          rows={visible}
          sort={filters.sort}
          dir={filters.dir}
          onSort={(sort, dir) => go({ ...filters, sort, dir })}
          empty="No tasks found."
          render={(task, key) => {
            if (key === 'title') {
              return (
                <Link href={`/tasks/${task.id}`} className="table-link">
                  {task.title}
                </Link>
              )
            }
            if (key === 'status') return <span className="pill">{task.status}</span>
            if (key === 'category') return task.category
            if (key === 'poster') {
              return (
                <>
                  {task.poster ? displayName(task.poster) : '—'}
                  {task.poster?.email ? (
                    <span className="meta"> · {task.poster.email}</span>
                  ) : null}
                </>
              )
            }
            if (key === 'budget') {
              return formatMoney(task.budget?.amount, task.budget?.currency)
            }
            if (key === 'visibility') {
              return task.hidden ? (
                <span className="pill pill-warn">hidden</span>
              ) : (
                <span className="pill">public</span>
              )
            }
            return task.views ?? 0
          }}
        />
      ) : null}

      <PaginationBar
        shownCount={visible.length}
        fetchedCount={rows.length}
        pageSize={filters.first}
        filtered={taskClientFilterActive(filters)}
        onPageSize={(first: PageSize) => go({ ...filters, first })}
        canPrev={false}
        canNext={false}
        nextDisabledReason="Next page needs an after cursor on adminTasks. Showing this first-N API page only — see the BE follow-up."
      />
    </section>
  )
}

async function listTasks(filters: TaskListFilters): Promise<{
  rows: TaskHit[]
  banner: string | null
}> {
  const vars = toAdminTaskListVariablesFromFilters(filters)
  try {
    const result = await apolloClient.query<AdminTasksQuery>({
      query: AdminTasks,
      variables: vars,
      fetchPolicy: 'network-only',
    })
    return { rows: (result.data?.adminTasks ?? []) as TaskHit[], banner: null }
  } catch (error) {
    if (!isMissingAdminFieldError(error)) throw error
  }

  const result = await apolloClient.query<TasksQuery>({
    query: Tasks,
    variables: filters.q.trim() ? { filter: { search: filters.q.trim() } } : {},
    fetchPolicy: 'network-only',
  })
  return {
    rows: (result.data?.tasks ?? []) as TaskHit[],
    banner:
      'BE-42 adminTasks is not on this Apollo yet. Showing public marketplace tasks instead.',
  }
}
