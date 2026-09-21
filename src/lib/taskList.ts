import {
  bboxToParam,
  parseBBoxParam,
  type GeoBBox,
} from '@/lib/geo'
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
  type AdminTaskListVariables,
} from '@/lib/search'

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
  bbox: GeoBBox | null
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
  bbox: null,
  first: DEFAULT_TABLE_PAGE_SIZE,
  sort: '',
  dir: 'desc',
}

/** Session flag: bbox is not on the pointed-at Apollo (BE-49). */
let bboxFilterUnsupported = false

export function markBBoxFilterUnsupported(): void {
  bboxFilterUnsupported = true
}

export function isBBoxFilterUnsupported(): boolean {
  return bboxFilterUnsupported
}

export function resetBBoxFilterSupportForTests(): void {
  bboxFilterUnsupported = false
}

export const BBOX_UNSUPPORTED_NOTICE =
  'Map area (bbox) is not on this Apollo yet. Pins show this filter page; pan/zoom will not load a new area until bbox ships.'

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
    bbox: parseBBoxParam(params.get('bbox')),
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
  if (filters.bbox && !bboxFilterUnsupported) extras.bbox = filters.bbox
  if (Object.keys(extras).length === 0) return { first: vars.first }
  return { first: vars.first, filter: extras }
}

export function taskPageLocalFields(filters: TaskListFilters): string[] {
  const fields: string[] = []
  if (filters.category) fields.push('Category')
  if (filters.poster) fields.push('Poster')
  if (filters.budgetMin != null || filters.budgetMax != null) {
    fields.push('Budget range')
  }
  if (filters.budgetType !== 'ALL') fields.push('Budget type')
  if (filters.from || filters.to) fields.push('Job date')
  return fields
}

export function taskPageLocalNotice(filters: TaskListFilters): string | null {
  return pageLocalNotice(taskPageLocalFields(filters))
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
  if (next.bbox) setParam(params, 'bbox', bboxToParam(next.bbox))
  if (next.first !== DEFAULT_TABLE_PAGE_SIZE) {
    params.set('first', String(next.first))
  }
  setParam(params, 'sort', next.sort)
  if (next.sort && next.dir !== 'desc') params.set('dir', next.dir)
  const qs = params.toString()
  return qs ? `/?${qs}` : '/'
}
