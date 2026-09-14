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
