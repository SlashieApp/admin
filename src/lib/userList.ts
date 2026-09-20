import { isWorkerUser } from '@/lib/userInput'
import {
  DEFAULT_TABLE_PAGE_SIZE,
  includesNormalized,
  inDateRange,
  pageLocalNotice,
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
  email: string
  name: string
  disabled: TriState
  worker: TriState
  from: string
  to: string
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
  email: '',
  name: '',
  disabled: 'all',
  worker: 'all',
  from: '',
  to: '',
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
    email: String(data.get('email') ?? '').trim(),
    name: String(data.get('name') ?? '').trim(),
    disabled: parseTriState(String(data.get('disabled') ?? '')),
    worker: parseTriState(String(data.get('worker') ?? '')),
    from: parseDateInput(String(data.get('from') ?? '')),
    to: parseDateInput(String(data.get('to') ?? '')),
  }
}

export function parseUserListFilters(
  params: Pick<URLSearchParams, 'get'>,
): UserListFilters {
  return {
    q: parseOptionalString(params.get('q')),
    email: parseOptionalString(params.get('email')),
    name: parseOptionalString(params.get('name')),
    disabled: parseTriState(params.get('disabled')),
    worker: parseTriState(params.get('worker')),
    from: parseDateInput(params.get('from')),
    to: parseDateInput(params.get('to')),
    first: parsePageSize(params.get('first')),
    sort: parseOptionalString(params.get('sort')),
    dir: parseSortDir(params.get('dir')),
  }
}

/** Prefer the generic q, then email, then name for the server search string. */
export function userServerSearch(filters: UserListFilters): string {
  return filters.q || filters.email || filters.name
}

export function toUserListQueryVariables(
  filters: UserListFilters,
): AdminUserListVariables {
  return toAdminUserListVariables(
    userServerSearch(filters),
    filters.first || DEFAULT_ADMIN_PAGE_SIZE,
  )
}

export function userPageLocalFields(filters: UserListFilters): string[] {
  const fields: string[] = []
  if (filters.q && filters.email) fields.push('Email')
  if (filters.q && filters.name) fields.push('Name')
  if (!filters.q && filters.email && filters.name) fields.push('Name')
  if (filters.disabled !== 'all') fields.push('Active / disabled')
  if (filters.worker !== 'all') fields.push('Worker flag')
  if (filters.from || filters.to) fields.push('Created date')
  return fields
}

export function userPageLocalNotice(filters: UserListFilters): string | null {
  return pageLocalNotice(userPageLocalFields(filters))
}

export function refineUsers<T extends UserListRow>(
  rows: T[],
  filters: UserListFilters,
): T[] {
  const filtered = rows.filter((row) => {
    if (filters.email && !includesNormalized(row.email, filters.email)) {
      return false
    }
    if (
      filters.name &&
      !includesNormalized(row.profile?.name, filters.name) &&
      !includesNormalized(row.id, filters.name)
    ) {
      return false
    }
    if (filters.disabled === 'yes' && !row.disabled) return false
    if (filters.disabled === 'no' && row.disabled) return false
    const worker = isWorkerUser(row)
    if (filters.worker === 'yes' && !worker) return false
    if (filters.worker === 'no' && worker) return false
    if (!inDateRange(row.createdAt, filters.from, filters.to)) return false
    return true
  })
  return sortRows(filtered, filters.sort, filters.dir, userSortValue)
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
  setParam(params, 'email', next.email)
  setParam(params, 'name', next.name)
  const disabled = triStateToParam(next.disabled)
  if (disabled) params.set('disabled', disabled)
  const worker = triStateToParam(next.worker)
  if (worker) params.set('worker', worker)
  setParam(params, 'from', next.from)
  setParam(params, 'to', next.to)
  if (next.first !== DEFAULT_TABLE_PAGE_SIZE) {
    params.set('first', String(next.first))
  }
  setParam(params, 'sort', next.sort)
  if (next.sort && next.dir !== 'desc') params.set('dir', next.dir)
  const qs = params.toString()
  return qs ? `/users?${qs}` : '/users'
}
