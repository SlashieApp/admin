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

export function taskDossierPath(
  taskId: string,
  tab: TaskDossierTab = 'overview',
): string {
  if (tab === 'overview') return `/tasks/${taskId}`
  return `/tasks/${taskId}?tab=${tab}`
}
