export type ProductEventSpec = {
  event: string
  label: string
  incomplete?: boolean
}

/** Canonical marketplace events for the ops dashboard. Some `*_success` names are incomplete until FE-153. */
export const DASHBOARD_PRODUCT_EVENTS: ProductEventSpec[] = [
  { event: 'register_success', label: 'Register success', incomplete: true },
  { event: 'login_success', label: 'Login success', incomplete: true },
  { event: 'google_login_success', label: 'Google login success' },
  { event: 'task_create_success', label: 'Task create success' },
  { event: 'task_view', label: 'Task view' },
  { event: 'worker_setup_success', label: 'Worker setup success', incomplete: true },
  { event: 'quote_send_success', label: 'Quote send success', incomplete: true },
  { event: 'quote_accept_success', label: 'Quote accept success', incomplete: true },
  { event: 'job_verify_success', label: 'Job verify success', incomplete: true },
  { event: 'job_done_success', label: 'Job done success', incomplete: true },
  { event: '$pageview', label: 'Pageview' },
]

const INCOMPLETE = new Set(
  DASHBOARD_PRODUCT_EVENTS.filter((row) => row.incomplete).map((row) => row.event),
)

export function isIncompleteSuccessCapture(event: string): boolean {
  return INCOMPLETE.has(event)
}

export function productEventLabel(event: string): string {
  return DASHBOARD_PRODUCT_EVENTS.find((row) => row.event === event)?.label ?? event
}
