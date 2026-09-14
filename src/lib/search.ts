import { looksLikeId } from '@/lib/adminEmail'

export const DEFAULT_ADMIN_PAGE_SIZE = 50

export type AdminHomeMode = 'tasks' | 'users'

export type AdminSearchVariables = {
  search?: string
  id?: string
}

export type AdminTaskFilter = {
  search?: string
  id?: string
}

export type AdminTaskListVariables = {
  filter?: AdminTaskFilter
  first: number
}

export type AdminUserListVariables = {
  search?: string
  id?: string
  first: number
}

export function toAdminSearchVariables(raw: string): AdminSearchVariables {
  const query = raw.trim()
  if (!query) return {}
  if (looksLikeId(query)) {
    return { search: query, id: query }
  }
  return { search: query }
}

/** Live `adminTasks` takes `AdminTaskFilter` + `first`, not top-level search/id. */
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
