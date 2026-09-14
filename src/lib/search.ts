import { looksLikeId } from '@/lib/adminEmail'

export type AdminSearchVariables = {
  search?: string
  id?: string
}

export function toAdminSearchVariables(raw: string): AdminSearchVariables {
  const query = raw.trim()
  if (!query) return {}
  if (looksLikeId(query)) {
    return { search: query, id: query }
  }
  return { search: query }
}

/** BE-42 `adminTasks` takes `AdminTaskFilter`, not top-level search/id. */
export function toAdminTaskVariables(raw: string): {
  filter?: AdminSearchVariables
} {
  const filter = toAdminSearchVariables(raw)
  return Object.keys(filter).length > 0 ? { filter } : {}
}
