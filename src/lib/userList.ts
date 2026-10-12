import { isWorkerUser } from '@/lib/userInput'
import {
  dayEndIso,
  dayStartIso,
  DEFAULT_TABLE_PAGE_SIZE,
  parseDateInput,
  parseOptionalString,
  parsePageSize,
  parseSortDir,
  parseTriState,
  setParam,
  sortRows,
  triStateToParam,
  type SortDir,
  type TriState,
} from '@/lib/listParams'
import {
  DEFAULT_ADMIN_PAGE_SIZE,
  toAdminUserListVariables,
  type AdminUserListVariables,
} from '@/lib/search'

export type UserListFilters = {
  q: string
  disabled: TriState
  worker: TriState
  from: string
  to: string
  after: string
  first: number
  sort: string
  dir: SortDir
}

export type UserListRow = {
  id: string
  email: string
  createdAt?: unknown
  disabled?: boolean | null
  profile?: { name?: string | null } | null
  worker?: { id?: string | null } | null
}

const EMPTY_FILTERS: UserListFilters = {
  q: '',
  disabled: 'all',
  worker: 'all',
  from: '',
  to: '',
  after: '',
  first: DEFAULT_TABLE_PAGE_SIZE,
  sort: '',
  dir: 'desc',
}

export function userFiltersFromForm(
  data: FormData,
  current: UserListFilters,
): UserListFilters {
  return {
    ...current,
    q: String(data.get('q') ?? '').trim(),
    disabled: parseTriState(String(data.get('disabled') ?? '')),
    worker: parseTriState(String(data.get('worker') ?? '')),
    from: parseDateInput(String(data.get('from') ?? '')),
    to: parseDateInput(String(data.get('to') ?? '')),
    after: '',
  }
}

export function parseUserListFilters(
  params: Pick<URLSearchParams, 'get'>,
): UserListFilters {
  return {
    q: parseOptionalString(params.get('q')),
    disabled: parseTriState(params.get('disabled')),
    worker: parseTriState(params.get('worker')),
    from: parseDateInput(params.get('from')),
    to: parseDateInput(params.get('to')),
    after: parseOptionalString(params.get('after')),
    first: parsePageSize(params.get('first')),
    sort: parseOptionalString(params.get('sort')),
    dir: parseSortDir(params.get('dir')),
  }
}

export function toUserListQueryVariables(
  filters: UserListFilters,
): AdminUserListVariables {
  const vars = toAdminUserListVariables(
    filters.q,
    filters.first || DEFAULT_ADMIN_PAGE_SIZE,
  )
  if (filters.disabled !== 'all') vars.disabled = filters.disabled === 'yes'
  if (filters.worker !== 'all') vars.isWorker = filters.worker === 'yes'
  if (filters.from) vars.createdAfter = dayStartIso(filters.from)
  if (filters.to) vars.createdBefore = dayEndIso(filters.to)
  if (filters.after) vars.after = filters.after
  return vars
}

/** Sorts the fetched page only (column sort). Filters are all server-side. */
export function sortUsers<T extends UserListRow>(
  rows: T[],
  filters: UserListFilters,
): T[] {
  return sortRows(rows, filters.sort, filters.dir, userSortValue)
}

export function userSortValue(row: UserListRow, key: string): unknown {
  switch (key) {
    case 'name':
      return row.profile?.name || row.email
    case 'email':
      return row.email
    case 'role':
      return isWorkerUser(row) ? 'worker' : 'customer'
    case 'status':
      return row.disabled ? 'disabled' : 'active'
    case 'created':
      return String(row.createdAt ?? '')
    default:
      return ''
  }
}

export function userListPath(filters: Partial<UserListFilters> = {}): string {
  const next = { ...EMPTY_FILTERS, ...filters }
  const params = new URLSearchParams()
  setParam(params, 'q', next.q)
  const disabled = triStateToParam(next.disabled)
  if (disabled) params.set('disabled', disabled)
  const worker = triStateToParam(next.worker)
  if (worker) params.set('worker', worker)
  setParam(params, 'from', next.from)
  setParam(params, 'to', next.to)
  setParam(params, 'after', next.after)
  if (next.first !== DEFAULT_TABLE_PAGE_SIZE) {
    params.set('first', String(next.first))
  }
  setParam(params, 'sort', next.sort)
  if (next.sort && next.dir !== 'desc') params.set('dir', next.dir)
  const qs = params.toString()
  return qs ? `/users?${qs}` : '/users'
}
