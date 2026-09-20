import { looksLikeId } from '@/lib/adminEmail'
import {
  DEFAULT_ADMIN_PAGE_SIZE,
  type AdminUserListVariables,
} from '@/lib/search'
import { isWorkerUser } from '@/lib/userInput'
import {
  parseIsoDate,
  parseOptionalText,
  parsePageSize,
  parseSortDir,
  parseTriState,
  pathWithQuery,
  setParam,
  sortBy,
  matchesDateRange,
  matchesText,
  type PageSize,
  type SortDir,
} from '@/lib/listQuery'

export type UserListFilters = {
  q: string
  email: string
  name: string
  disabled: 'all' | 'yes' | 'no'
  worker: 'all' | 'yes' | 'no'
  from: string
  to: string
  sort: string
  dir: SortDir
  first: PageSize
}

export const USER_LIST_SORTS = [
  'name',
  'email',
  'createdAt',
  'status',
] as const

export type UserListRow = {
  id: string
  email: string
  createdAt?: unknown
  disabled: boolean
  profile?: { name?: string | null } | null
  worker?: { id?: string | null } | null
}

const DEFAULT_FILTERS: UserListFilters = {
  q: '',
  email: '',
  name: '',
  disabled: 'all',
  worker: 'all',
  from: '',
  to: '',
  sort: 'name',
  dir: 'asc',
  first: DEFAULT_ADMIN_PAGE_SIZE,
}

export function parseUserListFilters(
  params: Pick<URLSearchParams, 'get'>,
): UserListFilters {
  const sort = params.get('sort')?.trim() ?? ''
  return {
    q: parseOptionalText(params.get('q')),
    email: parseOptionalText(params.get('email')),
    name: parseOptionalText(params.get('name')),
    disabled: parseTriState(params.get('disabled')),
    worker: parseTriState(params.get('worker')),
    from: parseIsoDate(params.get('from')),
    to: parseIsoDate(params.get('to')),
    sort: (USER_LIST_SORTS as readonly string[]).includes(sort)
      ? sort
      : DEFAULT_FILTERS.sort,
    dir: params.get('dir') ? parseSortDir(params.get('dir')) : DEFAULT_FILTERS.dir,
    first: parsePageSize(params.get('first'), DEFAULT_ADMIN_PAGE_SIZE),
  }
}

export function userListPath(
  filters: Partial<UserListFilters>,
  pathname = '/users',
): string {
  const next = { ...DEFAULT_FILTERS, ...filters }
  const onUsersRoute = pathname.startsWith('/users')
  const params = new URLSearchParams()
  if (!onUsersRoute) params.set('mode', 'users')
  setParam(params, 'q', next.q)
  setParam(params, 'email', next.email)
  setParam(params, 'name', next.name)
  if (next.disabled !== 'all') params.set('disabled', next.disabled)
  if (next.worker !== 'all') params.set('worker', next.worker)
  setParam(params, 'from', next.from)
  setParam(params, 'to', next.to)
  if (next.sort !== DEFAULT_FILTERS.sort) params.set('sort', next.sort)
  if (next.dir !== 'asc') params.set('dir', next.dir)
  if (next.first !== DEFAULT_ADMIN_PAGE_SIZE) params.set('first', String(next.first))
  const base = onUsersRoute ? '/users' : '/'
  return pathWithQuery(base, params)
}

export function toAdminUserListVariablesFromFilters(
  filters: UserListFilters,
): AdminUserListVariables {
  const query = filters.q.trim()
  if (!query) return { first: filters.first }
  if (looksLikeId(query)) {
    return { first: filters.first, search: query, id: query }
  }
  return { first: filters.first, search: query }
}

export function applyUserClientFilters<T extends UserListRow>(
  rows: T[],
  filters: UserListFilters,
): T[] {
  return rows.filter((row) => {
    if (filters.email && !matchesText([row.email], filters.email)) return false
    if (
      filters.name &&
      !matchesText([row.profile?.name, row.email], filters.name)
    ) {
      return false
    }
    if (filters.disabled === 'yes' && !row.disabled) return false
    if (filters.disabled === 'no' && row.disabled) return false
    const worker = isWorkerUser(row)
    if (filters.worker === 'yes' && !worker) return false
    if (filters.worker === 'no' && worker) return false
    if (
      !matchesDateRange(row.createdAt, {
        from: filters.from || undefined,
        to: filters.to || undefined,
      })
    ) {
      return false
    }
    return true
  })
}

export function sortUserRows<T extends UserListRow>(
  rows: T[],
  filters: UserListFilters,
): T[] {
  return sortBy(rows, filters.dir, (row) => {
    switch (filters.sort) {
      case 'email':
        return row.email
      case 'createdAt':
        return row.createdAt ? String(row.createdAt) : ''
      case 'status':
        return row.disabled ? 'disabled' : 'active'
      default:
        return row.profile?.name || row.email
    }
  })
}

export function userClientFilterActive(filters: UserListFilters): boolean {
  return Boolean(
    filters.email ||
      filters.name ||
      filters.disabled !== 'all' ||
      filters.worker !== 'all' ||
      filters.from ||
      filters.to,
  )
}
