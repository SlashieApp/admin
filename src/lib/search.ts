import { looksLikeId } from '@/lib/adminEmail'
import type { GeoBBox } from '@/lib/geo'

export const DEFAULT_ADMIN_PAGE_SIZE = 50

export type AdminTaskFilter = {
  search?: string
  id?: string
  status?: string[]
  /** Suspended for any reason (`Task.suspension`), or not suspended at all. */
  suspended?: boolean
  category?: string
  posterSearch?: string
  budgetMin?: number
  budgetMax?: number
  budgetType?: string
  createdAfter?: string
  createdBefore?: string
  bbox?: GeoBBox
}

export type AdminTaskListVariables = {
  filter?: AdminTaskFilter
  first: number
  after?: string
}

export type AdminUserListVariables = {
  search?: string
  id?: string
  disabled?: boolean
  isWorker?: boolean
  createdAfter?: string
  createdBefore?: string
  first: number
  after?: string
}

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
