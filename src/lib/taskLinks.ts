import { publicTaskUrl } from '@/lib/env'

export const TASK_DOSSIER_TABS = [
  'overview',
  'quotes',
  'activity',
  'admin',
] as const

export type TaskDossierTab = (typeof TASK_DOSSIER_TABS)[number]

export function parseTaskDossierTab(
  value: string | null | undefined,
): TaskDossierTab {
  return TASK_DOSSIER_TABS.includes(value as TaskDossierTab)
    ? (value as TaskDossierTab)
    : 'overview'
}

export function taskDossierPath(taskId: string, tab?: TaskDossierTab): string {
  const base = `/tasks/${taskId}`
  if (!tab || tab === 'overview') return base
  return `${base}?tab=${tab}`
}

export function liveTaskHref(taskId: string): string {
  return publicTaskUrl(taskId)
}

export type RelatedReportLink = {
  id: string
  href: string
  label: string
  status?: string | null
}

export type RelatedFeedbackLink = {
  id: string
  href: string
  label: string
}

export function isRelatedTaskReport(
  row: { targetType?: string | null; targetId?: string | null },
  taskId: string,
): boolean {
  return row.targetType === 'TASK' && row.targetId === taskId
}

export function isRelatedTaskFeedback(
  row: {
    pageUrl?: string | null
    path?: string | null
    message?: string | null
  },
  taskId: string,
): boolean {
  const needle = `/tasks/${taskId}`
  const hay = [row.pageUrl, row.path, row.message].filter(Boolean).join(' ')
  return hay.includes(needle)
}

export function relatedReportLink(row: {
  id: string
  status?: string | null
  reason?: string | null
}): RelatedReportLink {
  return {
    id: row.id,
    href: `/reports?id=${encodeURIComponent(row.id)}`,
    label: row.reason ? `${row.reason} · ${row.status ?? ''}`.trim() : row.id,
    status: row.status,
  }
}

export function relatedFeedbackLink(row: {
  id: string
  category?: string | null
}): RelatedFeedbackLink {
  return {
    id: row.id,
    href: `/feedback?id=${encodeURIComponent(row.id)}`,
    label: row.category ? `${row.category} feedback` : 'Feedback',
  }
}
