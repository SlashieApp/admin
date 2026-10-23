/**
 * Suspension (BE-108): why a task is frozen, and the copy around the actions
 * that change it. `Task.suspension` is null when nothing is suspended. Both
 * reasons can apply at once and each is lifted on its own: Slashie (ops) via
 * `adminSetTaskSuspended`, and the poster's account via `adminSetUserDisabled`.
 */

export type TaskSuspensionState = {
  bySlashie: boolean
  posterSuspended: boolean
}

export type TaskSuspensionLike = TaskSuspensionState | null | undefined

export const ACCOUNT_SUSPENDED_LABEL = 'Account suspended'

export function isTaskSuspended(suspension: TaskSuspensionLike): boolean {
  return Boolean(suspension?.bySlashie || suspension?.posterSuspended)
}

/** The state `adminSetTaskSuspended` toggles. A poster-only suspension does not count. */
export function isSuspendedBySlashie(suspension: TaskSuspensionLike): boolean {
  return Boolean(suspension?.bySlashie)
}

/**
 * Short reason that reads after the word "Suspended": "by Slashie",
 * "because the poster's account is suspended", or both. Empty when not suspended.
 */
export function suspensionReason(suspension: TaskSuspensionLike): string {
  if (suspension?.bySlashie && suspension.posterSuspended) {
    return "by Slashie and because the poster's account is suspended"
  }
  if (suspension?.bySlashie) return 'by Slashie'
  if (suspension?.posterSuspended) {
    return "because the poster's account is suspended"
  }
  return ''
}

/** One sentence for the dossier banner. Empty when the task is not suspended. */
export function suspensionSentence(suspension: TaskSuspensionLike): string {
  if (suspension?.bySlashie && suspension.posterSuspended) {
    return "Slashie suspended this task, and the poster's account is suspended too."
  }
  if (suspension?.bySlashie) return 'Slashie suspended this task.'
  if (suspension?.posterSuspended) {
    return "This task is suspended because the poster's account is suspended."
  }
  return ''
}

const SUSPEND_TASK_CONFIRM =
  'Suspend this task? It disappears from search, and its quotes and bookings are frozen until you unsuspend it.'

const UNSUSPEND_TASK_CONFIRM =
  'Unsuspend this task? It can appear in search again, and its quotes and bookings are unfrozen.'

/** Confirm text for the Suspend task button. */
export function suspendTaskConfirm(suspension: TaskSuspensionLike): string {
  return suspension?.posterSuspended
    ? `${SUSPEND_TASK_CONFIRM} The poster's account is already suspended, so this keeps the task suspended after that account is re-enabled.`
    : SUSPEND_TASK_CONFIRM
}

/** Confirm text for the Unsuspend task button. */
export function unsuspendTaskConfirm(suspension: TaskSuspensionLike): string {
  return suspension?.posterSuspended
    ? `${UNSUSPEND_TASK_CONFIRM} The poster's account is also suspended, so the task stays suspended until that account is re-enabled.`
    : UNSUSPEND_TASK_CONFIRM
}

/** Success message after `adminSetTaskSuspended`, from the task it returned. */
export function taskSuspensionResult(
  requested: boolean,
  after: TaskSuspensionLike,
): string {
  if (requested) return 'Task suspended.'
  return after?.posterSuspended
    ? "Suspension by Slashie lifted. The task stays suspended because the poster's account is suspended."
    : 'Task unsuspended.'
}

/** Confirm text for the Disable user / Re-enable user button (BE-108 cascade). */
export function userDisabledConfirm(disabling: boolean): string {
  return disabling
    ? 'Disable this account? It also suspends every task they posted and freezes their quotes and bookings. Re-enabling the account lifts that, but not tasks Slashie suspended directly.'
    : 'Re-enable this account? This lifts the suspension on the tasks they posted and unfreezes their quotes and bookings. Tasks Slashie suspended directly stay suspended until you unsuspend them.'
}

/** Success message after `adminSetUserDisabled`. */
export function userDisabledResult(disabled: boolean): string {
  return disabled
    ? 'User disabled. Their tasks are suspended and their quotes and bookings are frozen.'
    : 'User re-enabled. Their tasks, quotes and bookings are unfrozen. Tasks Slashie suspended directly stay suspended.'
}
