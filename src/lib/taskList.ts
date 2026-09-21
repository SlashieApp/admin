import {
  DEFAULT_TABLE_PAGE_SIZE,
  includesNormalized,
  inDateRange,
  pageLocalNotice,
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
  type AdminTaskFilter,
  type AdminTaskListVariables,
} from '@/lib/search'
import {
  omitFilterKeys,
  type GeoBBox,
} from '@/lib/geo'

export const TASK_STATUSES = [
  'DRAFT',
  'OPEN',
  'AWARDED',
  'QUOTE_ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'CONFIRMED',
] as const

export const TASK_BUDGET_TYPES = ['ONE_OFF', 'PER_DAY', 'PER_HOUR'] as const

export const TASK_CATEGORIES = [
  'HANDYMAN',
  'FURNITURE_ASSEMBLY',
  'MOUNTING_INSTALLATION',
  'PLUMBING',
  'ELECTRICAL',
  'CARPENTRY',
  'PAINTING',
  'CLEANING',
  'GARDENING',
  'REMOVALS',
  'DELIVERY_ERRANDS',
  'OTHER',
] as const

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
  first: number
  sort: string
  dir: SortDir
}

export type TaskListRow = {
  id: string
  title: string
  category: string
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
    first: parsePageSize(params.get('first')),
    sort: parseOptionalString(params.get('sort')),
    dir: parseSortDir(params.get('dir')),
  }
}

export type TaskListQueryOptions = {
  bbox?: GeoBBox | null
  /** Keys the live API already rejected (BE-49 fields). */
  denyKeys?: Iterable<string>
}

export function toTaskListQueryVariables(
  filters: TaskListFilters,
  options: TaskListQueryOptions = {},
): AdminTaskListVariables {
  const vars = toAdminTaskListVariables(
    filters.q,
    filters.first || DEFAULT_ADMIN_PAGE_SIZE,
  )
  const extras: AdminTaskFilter = {
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
  if (options.bbox) extras.bbox = options.bbox
  const filter = omitFilterKeys(extras, options.denyKeys ?? [])
  if (Object.keys(filter).length === 0) return { first: vars.first }
  return { first: vars.first, filter }
}

/** Fields still applied on the current page because Apollo rejected them. */
export function taskPageLocalFields(
  filters: TaskListFilters,
  denyKeys: Iterable<string> = [],
): string[] {
  const denied = new Set(denyKeys)
  const fields: string[] = []
  if (filters.category && denied.has('category')) fields.push('Category')
  if (filters.poster && denied.has('posterSearch')) fields.push('Poster')
  if (
    (filters.budgetMin != null || filters.budgetMax != null) &&
    (denied.has('budgetMin') || denied.has('budgetMax'))
  ) {
    fields.push('Budget range')
  }
  if (filters.budgetType !== 'ALL' && denied.has('budgetType')) {
    fields.push('Budget type')
  }
  if (filters.from || filters.to) fields.push('Job date')
  return fields
}

export function taskPageLocalNotice(
  filters: TaskListFilters,
  denyKeys: Iterable<string> = [],
): string | null {
  return pageLocalNotice(taskPageLocalFields(filters, denyKeys))
}

export function refineTasks<T extends TaskListRow>(
  rows: T[],
  filters: TaskListFilters,
): T[] {
  const filtered = rows.filter((row) => {
    if (
      filters.category &&
      !includesNormalized(row.category, filters.category)
    ) {
      return false
    }
    if (filters.poster) {
      const poster = [
        row.poster?.profile?.name,
        row.poster?.email,
        row.poster?.id,
      ]
        .filter(Boolean)
        .join(' ')
      if (!includesNormalized(poster, filters.poster)) return false
    }
    const amount = row.budget?.amount
    if (filters.budgetMin != null && (amount == null || amount < filters.budgetMin)) {
      return false
    }
    if (filters.budgetMax != null && (amount == null || amount > filters.budgetMax)) {
      return false
    }
    if (
      filters.budgetType !== 'ALL' &&
      row.budget?.type !== filters.budgetType
    ) {
      return false
    }
    if (!inDateRange(row.datetime?.date, filters.from, filters.to)) {
      return false
    }
    return true
  })
  return sortRows(filtered, filters.sort, filters.dir, taskSortValue)
}

export function taskSortValue(row: TaskListRow, key: string): unknown {
  switch (key) {
    case 'title':
      return row.title
    case 'status':
      return row.status
    case 'category':
      return row.category
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
  if (next.first !== DEFAULT_TABLE_PAGE_SIZE) {
    params.set('first', String(next.first))
  }
  setParam(params, 'sort', next.sort)
  if (next.sort && next.dir !== 'desc') params.set('dir', next.dir)
  const qs = params.toString()
  return qs ? `/?${qs}` : '/'
}
