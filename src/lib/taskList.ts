import {
  bboxToParam,
  parseBBoxParam,
  type GeoBBox,
} from '@/lib/geo'
import {
  dayEndIso,
  dayStartIso,
  DEFAULT_TABLE_PAGE_SIZE,
  parseDateInput,
  parseOptionalNumber,
  parseOptionalString,
  parsePageSize,
  parseSortDir,
  setParam,
  sortRows,
  type SortDir,
} from '@/lib/listParams'
import {
  DEFAULT_ADMIN_PAGE_SIZE,
  toAdminTaskListVariables,
  type AdminTaskListVariables,
} from '@/lib/search'

export const TASK_STATUSES = [
  'DRAFT',
  'OPEN',
  'AWARDED',
  'CANCELLED',
] as const

export const TASK_BUDGET_TYPES = ['ONE_OFF', 'PER_DAY', 'PER_HOUR'] as const

export type TaskStatusValue = (typeof TASK_STATUSES)[number]
export type TaskStatusFilter = TaskStatusValue | 'ALL'
export type TaskVisibilityFilter = 'all' | 'public' | 'hidden'
export type TaskBudgetTypeFilter = (typeof TASK_BUDGET_TYPES)[number] | 'ALL'

export type TaskListFilters = {
  q: string
  status: TaskStatusFilter
  visibility: TaskVisibilityFilter
  category: string
  poster: string
  budgetMin: number | null
  budgetMax: number | null
  budgetType: TaskBudgetTypeFilter
  from: string
  to: string
  bbox: GeoBBox | null
  after: string
  first: number
  sort: string
  dir: SortDir
}

export type TaskListRow = {
  id: string
  title: string
  /** Open-text categories (BE-79). */
  categories: readonly string[]
  status: string
  views?: number | null
  hidden?: boolean | null
  budget?: {
    amount?: number | null
    currency?: string | null
    type?: string | null
  } | null
  datetime?: { date?: string | null } | null
  poster?: {
    id?: string | null
    email?: string | null
    profile?: { name?: string | null } | null
  } | null
}

const EMPTY_FILTERS: TaskListFilters = {
  q: '',
  status: 'ALL',
  visibility: 'all',
  category: '',
  poster: '',
  budgetMin: null,
  budgetMax: null,
  budgetType: 'ALL',
  from: '',
  to: '',
  bbox: null,
  after: '',
  first: DEFAULT_TABLE_PAGE_SIZE,
  sort: '',
  dir: 'desc',
}

export function parseTaskStatusFilter(
  value: string | null | undefined,
): TaskStatusFilter {
  return TASK_STATUSES.includes(value as TaskStatusValue)
    ? (value as TaskStatusValue)
    : 'ALL'
}

export function parseTaskVisibilityFilter(
  value: string | null | undefined,
): TaskVisibilityFilter {
  if (value === 'hidden' || value === 'public') return value
  return 'all'
}

export function parseTaskBudgetTypeFilter(
  value: string | null | undefined,
): TaskBudgetTypeFilter {
  return TASK_BUDGET_TYPES.includes(value as (typeof TASK_BUDGET_TYPES)[number])
    ? (value as (typeof TASK_BUDGET_TYPES)[number])
    : 'ALL'
}

export function taskFiltersFromForm(
  data: FormData,
  current: TaskListFilters,
): TaskListFilters {
  return {
    ...current,
    q: String(data.get('q') ?? '').trim(),
    status: parseTaskStatusFilter(String(data.get('status') ?? '')),
    visibility: parseTaskVisibilityFilter(String(data.get('visibility') ?? '')),
    category: String(data.get('category') ?? '').trim(),
    poster: String(data.get('poster') ?? '').trim(),
    budgetMin: parseOptionalNumber(String(data.get('budgetMin') ?? '')),
    budgetMax: parseOptionalNumber(String(data.get('budgetMax') ?? '')),
    budgetType: parseTaskBudgetTypeFilter(String(data.get('budgetType') ?? '')),
    from: parseDateInput(String(data.get('from') ?? '')),
    to: parseDateInput(String(data.get('to') ?? '')),
    after: '',
  }
}

export function parseTaskListFilters(
  params: Pick<URLSearchParams, 'get'>,
): TaskListFilters {
  return {
    q: parseOptionalString(params.get('q')),
    status: parseTaskStatusFilter(params.get('status')),
    visibility: parseTaskVisibilityFilter(params.get('visibility')),
    category: parseOptionalString(params.get('category')),
    poster: parseOptionalString(params.get('poster')),
    budgetMin: parseOptionalNumber(params.get('budgetMin')),
    budgetMax: parseOptionalNumber(params.get('budgetMax')),
    budgetType: parseTaskBudgetTypeFilter(params.get('budgetType')),
    from: parseDateInput(params.get('from')),
    to: parseDateInput(params.get('to')),
    bbox: parseBBoxParam(params.get('bbox')),
    after: parseOptionalString(params.get('after')),
    first: parsePageSize(params.get('first')),
    sort: parseOptionalString(params.get('sort')),
    dir: parseSortDir(params.get('dir')),
  }
}

export function toTaskListQueryVariables(
  filters: TaskListFilters,
): AdminTaskListVariables {
  const vars = toAdminTaskListVariables(
    filters.q,
    filters.first || DEFAULT_ADMIN_PAGE_SIZE,
  )
  const extras: NonNullable<AdminTaskListVariables['filter']> = {
    ...vars.filter,
  }
  if (filters.status !== 'ALL') extras.status = [filters.status]
  if (filters.visibility === 'hidden') extras.hidden = true
  if (filters.visibility === 'public') extras.hidden = false
  if (filters.category) extras.category = filters.category
  if (filters.poster) extras.posterSearch = filters.poster
  if (filters.budgetMin != null) extras.budgetMin = filters.budgetMin
  if (filters.budgetMax != null) extras.budgetMax = filters.budgetMax
  if (filters.budgetType !== 'ALL') extras.budgetType = filters.budgetType
  if (filters.from) extras.createdAfter = dayStartIso(filters.from)
  if (filters.to) extras.createdBefore = dayEndIso(filters.to)
  if (filters.bbox) extras.bbox = filters.bbox
  const page = filters.after ? { after: filters.after } : {}
  if (Object.keys(extras).length === 0) return { first: vars.first, ...page }
  return { first: vars.first, filter: extras, ...page }
}

/** Sorts the fetched page only (column sort). Filters are all server-side. */
export function sortTasks<T extends TaskListRow>(
  rows: T[],
  filters: TaskListFilters,
): T[] {
  return sortRows(rows, filters.sort, filters.dir, taskSortValue)
}

export function taskSortValue(row: TaskListRow, key: string): unknown {
  switch (key) {
    case 'title':
      return row.title
    case 'status':
      return row.status
    case 'category':
      return row.categories.join(', ')
    case 'poster':
      return row.poster?.profile?.name || row.poster?.email || ''
    case 'budget':
      return row.budget?.amount ?? -1
    case 'visibility':
      return row.hidden ? 'hidden' : 'public'
    case 'views':
      return row.views ?? 0
    case 'date':
      return row.datetime?.date ?? ''
    default:
      return ''
  }
}

export function taskListPath(
  filters: Partial<TaskListFilters> = {},
): string {
  const next = { ...EMPTY_FILTERS, ...filters }
  const params = new URLSearchParams()
  setParam(params, 'q', next.q)
  if (next.status !== 'ALL') params.set('status', next.status)
  if (next.visibility !== 'all') params.set('visibility', next.visibility)
  setParam(params, 'category', next.category)
  setParam(params, 'poster', next.poster)
  if (next.budgetMin != null) params.set('budgetMin', String(next.budgetMin))
  if (next.budgetMax != null) params.set('budgetMax', String(next.budgetMax))
  if (next.budgetType !== 'ALL') params.set('budgetType', next.budgetType)
  setParam(params, 'from', next.from)
  setParam(params, 'to', next.to)
  if (next.bbox) setParam(params, 'bbox', bboxToParam(next.bbox))
  setParam(params, 'after', next.after)
  if (next.first !== DEFAULT_TABLE_PAGE_SIZE) {
    params.set('first', String(next.first))
  }
  setParam(params, 'sort', next.sort)
  if (next.sort && next.dir !== 'desc') params.set('dir', next.dir)
  const qs = params.toString()
  return qs ? `/?${qs}` : '/'
}
