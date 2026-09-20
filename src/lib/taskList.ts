import { looksLikeId } from '@/lib/adminEmail'
import {
  DEFAULT_ADMIN_PAGE_SIZE,
  type AdminTaskFilter,
  type AdminTaskListVariables,
} from '@/lib/search'
import {
  parseIsoDate,
  parseOptionalNumber,
  parseOptionalText,
  parsePageSize,
  parseSortDir,
  parseTriState,
  pathWithQuery,
  setParam,
  sortBy,
  matchesDateRange,
  matchesText,
  triStateToBoolean,
  type PageSize,
  type SortDir,
} from '@/lib/listQuery'
import { TASK_STATUSES } from '@/lib/taskInput'
import { TaskBudgetType, TaskStatus } from '@codegen/schema'

export type TaskHiddenFilter = 'all' | 'yes' | 'no'

export type TaskListFilters = {
  q: string
  category: string
  poster: string
  status: TaskStatus | ''
  budgetMin?: number
  budgetMax?: number
  budgetType: TaskBudgetType | ''
  hidden: TaskHiddenFilter
  from: string
  to: string
  sort: string
  dir: SortDir
  first: PageSize
}

export const TASK_LIST_SORTS = [
  'title',
  'status',
  'category',
  'poster',
  'budget',
  'views',
] as const

export type TaskListRow = {
  id: string
  title: string
  category: string
  status: string
  views?: number | null
  hidden?: boolean | null
  datetime?: { date?: string | null } | null
  budget?: {
    amount: number
    currency: string
    type: string
  } | null
  poster?: {
    id: string
    email: string
    profile?: { name?: string | null } | null
  } | null
}

const DEFAULT_FILTERS: TaskListFilters = {
  q: '',
  category: '',
  poster: '',
  status: '',
  budgetType: '',
  hidden: 'all',
  from: '',
  to: '',
  sort: 'title',
  dir: 'asc',
  first: DEFAULT_ADMIN_PAGE_SIZE,
}

export function parseTaskStatus(
  value: string | null | undefined,
): TaskStatus | '' {
  const raw = value?.trim()
  return raw && (TASK_STATUSES as string[]).includes(raw)
    ? (raw as TaskStatus)
    : ''
}

export function parseTaskBudgetType(
  value: string | null | undefined,
): TaskBudgetType | '' {
  const raw = value?.trim()
  return raw && Object.values(TaskBudgetType).includes(raw as TaskBudgetType)
    ? (raw as TaskBudgetType)
    : ''
}

export function parseTaskListFilters(
  params: Pick<URLSearchParams, 'get'>,
): TaskListFilters {
  const sort = params.get('sort')?.trim() ?? ''
  return {
    q: parseOptionalText(params.get('q')),
    category: parseOptionalText(params.get('category')),
    poster: parseOptionalText(params.get('poster')),
    status: parseTaskStatus(params.get('status')),
    budgetMin: parseOptionalNumber(params.get('budgetMin')),
    budgetMax: parseOptionalNumber(params.get('budgetMax')),
    budgetType: parseTaskBudgetType(params.get('budgetType')),
    hidden: parseTriState(params.get('hidden')),
    from: parseIsoDate(params.get('from')),
    to: parseIsoDate(params.get('to')),
    sort: (TASK_LIST_SORTS as readonly string[]).includes(sort)
      ? sort
      : DEFAULT_FILTERS.sort,
    dir: params.get('dir') ? parseSortDir(params.get('dir')) : DEFAULT_FILTERS.dir,
    first: parsePageSize(params.get('first'), DEFAULT_ADMIN_PAGE_SIZE),
  }
}

export function taskListPath(filters: Partial<TaskListFilters>): string {
  const next = { ...DEFAULT_FILTERS, ...filters }
  const params = new URLSearchParams()
  setParam(params, 'q', next.q)
  setParam(params, 'category', next.category)
  setParam(params, 'poster', next.poster)
  setParam(params, 'status', next.status)
  setParam(params, 'budgetMin', next.budgetMin)
  setParam(params, 'budgetMax', next.budgetMax)
  setParam(params, 'budgetType', next.budgetType)
  if (next.hidden !== 'all') params.set('hidden', next.hidden)
  setParam(params, 'from', next.from)
  setParam(params, 'to', next.to)
  if (next.sort !== DEFAULT_FILTERS.sort) params.set('sort', next.sort)
  if (next.dir !== 'asc') params.set('dir', next.dir)
  if (next.first !== DEFAULT_ADMIN_PAGE_SIZE) params.set('first', String(next.first))
  return pathWithQuery('/', params)
}

export function toAdminTaskListVariablesFromFilters(
  filters: TaskListFilters,
): AdminTaskListVariables {
  const filter: AdminTaskFilter = {}
  const query = filters.q.trim()
  if (query) {
    filter.search = query
    if (looksLikeId(query)) filter.id = query
  }
  if (filters.status) filter.status = [filters.status]
  const hidden = triStateToBoolean(filters.hidden)
  if (hidden !== undefined) filter.hidden = hidden
  return Object.keys(filter).length
    ? { first: filters.first, filter }
    : { first: filters.first }
}

export function applyTaskClientFilters<T extends TaskListRow>(
  rows: T[],
  filters: TaskListFilters,
): T[] {
  return rows.filter((row) => {
    if (
      filters.category &&
      row.category.trim().toLowerCase() !== filters.category.toLowerCase()
    ) {
      return false
    }
    if (
      filters.poster &&
      !matchesText(
        [row.poster?.profile?.name, row.poster?.email, row.poster?.id],
        filters.poster,
      )
    ) {
      return false
    }
    const amount = row.budget?.amount
    if (filters.budgetMin != null && (amount ?? -Infinity) < filters.budgetMin) {
      return false
    }
    if (filters.budgetMax != null && (amount ?? Infinity) > filters.budgetMax) {
      return false
    }
    if (filters.budgetType && row.budget?.type !== filters.budgetType) {
      return false
    }
    if (
      !matchesDateRange(row.datetime?.date, {
        from: filters.from || undefined,
        to: filters.to || undefined,
      })
    ) {
      return false
    }
    return true
  })
}

export function sortTaskRows<T extends TaskListRow>(
  rows: T[],
  filters: TaskListFilters,
): T[] {
  return sortBy(rows, filters.dir, (row) => {
    switch (filters.sort) {
      case 'status':
        return row.status
      case 'category':
        return row.category
      case 'poster':
        return row.poster?.profile?.name || row.poster?.email || ''
      case 'budget':
        return row.budget?.amount ?? null
      case 'views':
        return row.views ?? 0
      default:
        return row.title
    }
  })
}

export function taskClientFilterActive(filters: TaskListFilters): boolean {
  return Boolean(
    filters.category ||
      filters.poster ||
      filters.budgetMin != null ||
      filters.budgetMax != null ||
      filters.budgetType ||
      filters.from ||
      filters.to,
  )
}
