import { looksLikeId } from '@/lib/adminEmail'

export const DEFAULT_ADMIN_PAGE_SIZE = 50

export type AdminHomeMode = 'tasks' | 'users'

export type AdminTaskBBox = {
  swLat: number
  swLng: number
  neLat: number
  neLng: number
}

export type AdminTaskFilter = {
  search?: string
  id?: string
  status?: string[]
  hidden?: boolean
  category?: string
  posterSearch?: string
  posterId?: string
  budgetMin?: number
  budgetMax?: number
  budgetType?: string
  createdAfter?: string
  createdBefore?: string
  bbox?: AdminTaskBBox
}

export type AdminTaskListVariables = {
  filter?: AdminTaskFilter
  first: number
  after?: string
}

export type AdminUserListVariables = {
  search?: string
  id?: string
  first: number
}

/** Live `adminTasks` takes `AdminTaskFilter` + `first`. */
export function toAdminTaskListVariables(
  raw: string,
  first = DEFAULT_ADMIN_PAGE_SIZE,
): AdminTaskListVariables {
  const query = raw.trim()
  if (!query) return { first }
  if (looksLikeId(query)) {
    return { first, filter: { search: query, id: query } }
  }
  return { first, filter: { search: query } }
}

/** Alias used by main's BE-42 filter helper; always includes `first` for autoload. */
export function toAdminTaskVariables(raw: string): AdminTaskListVariables {
  return toAdminTaskListVariables(raw)
}

export function toAdminUserListVariables(
  raw: string,
  first = DEFAULT_ADMIN_PAGE_SIZE,
): AdminUserListVariables {
  const query = raw.trim()
  if (!query) return { first }
  if (looksLikeId(query)) {
    return { first, search: query, id: query }
  }
  return { first, search: query }
}

export function parseAdminHomeMode(
  value: string | null | undefined,
): AdminHomeMode {
  return value === 'users' ? 'users' : 'tasks'
}
