export type Named = {
  id?: string | null
  userId?: string | null
  email?: string | null
  legalName?: string | null
  profile?: { name?: string | null } | null
  user?: { id?: string | null; email?: string | null } | null
}

export function displayName(entity: Named | null | undefined): string {
  const name = entity?.profile?.name?.trim()
  if (name) return name
  const legal = entity?.legalName?.trim()
  if (legal) return legal
  const email = entity?.email?.trim()
  if (email) return email
  return entity?.id?.trim() || '—'
}

export type LinkedWorkerRow = {
  id: string
  userId?: string | null
  workerId?: string | null
  label: string
  email?: string | null
  href?: string | null
}

type QuoteLike = {
  id?: string | null
  worker?: {
    id?: string | null
    email?: string | null
    profile?: { name?: string | null } | null
    worker?: Named | null
  } | null
}

type OrderLike = {
  id?: string | null
  workerUserId?: string | null
  worker?: Named | null
}

function userHref(userId: string | null | undefined): string | null {
  return userId ? `/users/${userId}` : null
}

export function linkedWorkersFromDossier(input: {
  workers?: Array<Named | null | undefined> | null
  quotes?: Array<QuoteLike | null | undefined> | null
  orders?: Array<OrderLike | null | undefined> | null
}): LinkedWorkerRow[] {
  const rows: LinkedWorkerRow[] = []
  const seen = new Set<string>()

  function push(row: LinkedWorkerRow) {
    const key = row.workerId || row.userId || row.id
    if (!key || seen.has(key)) return
    seen.add(key)
    if (row.workerId) seen.add(row.workerId)
    if (row.userId) seen.add(row.userId)
    rows.push({ ...row, href: row.href ?? userHref(row.userId) })
  }

  for (const worker of input.workers ?? []) {
    if (!worker?.id) continue
    const userId = worker.userId || worker.user?.id || null
    push({
      id: worker.id,
      workerId: worker.id,
      userId,
      label: displayName(worker),
      email: worker.email || worker.user?.email,
    })
  }

  for (const quote of input.quotes ?? []) {
    const nested = quote?.worker?.worker
    const userId = quote?.worker?.id || nested?.userId || nested?.user?.id || null
    if (nested?.id) {
      push({
        id: nested.id,
        workerId: nested.id,
        userId,
        label: displayName(nested),
        email: quote?.worker?.email,
      })
      continue
    }
    if (quote?.worker?.id) {
      push({
        id: quote.worker.id,
        userId: quote.worker.id,
        label: displayName(quote.worker),
        email: quote.worker.email,
      })
    }
  }

  for (const order of input.orders ?? []) {
    const userId =
      order?.workerUserId || order?.worker?.userId || order?.worker?.user?.id || null
    if (order?.worker?.id) {
      push({
        id: order.worker.id,
        workerId: order.worker.id,
        userId,
        label: displayName(order.worker),
        email: order.worker.email || order.worker.user?.email,
      })
      continue
    }
    if (userId) {
      push({
        id: userId,
        userId,
        label: userId,
      })
    }
  }

  return rows
}

/**
 * Newest first. A reopened task (BE-108) keeps the old cancelled order next to
 * the new booking, so a task can have more than one.
 */
export function ordersNewestFirst<T extends { createdAt?: unknown }>(
  orders: readonly T[] | null | undefined,
): T[] {
  const time = (order: T) => Date.parse(String(order.createdAt ?? '')) || 0
  return [...(orders ?? [])].sort((a, b) => time(b) - time(a))
}

export type ActivityRow = {
  id: string
  title: string
  body: string
  at: string
  kind: 'flash' | 'timeline'
}

/** `AdminTaskActivity`: Messages flashes plus task timeline events (no chat messages). */
type ActivityLike = {
  source?: string | null
  type?: string | null
  title?: string | null
  body?: string | null
  createdAt?: string | null
  actorUserId?: string | null
  visibleToUserIds?: string[] | null
}

/** `RESCHEDULE_WITHDRAWN` → "Reschedule withdrawn" (task activity log types, BE-106). */
export function timelineTitle(type: string | null | undefined): string {
  const words = String(type ?? '').trim().toLowerCase().replace(/_/g, ' ')
  return words ? words[0].toUpperCase() + words.slice(1) : 'Activity'
}

/** `TaskSuspensionReason` values on `TASK_SUSPENDED` / `TASK_UNSUSPENDED` rows (BE-108), in words. */
const SUSPENSION_REASONS: Record<string, string> = {
  SLASHIE: 'suspended by Slashie',
  POSTER_SUSPENDED: "poster's account suspended",
}

function lowerWords(value: unknown): string {
  return String(value).toLowerCase().replace(/_/g, ' ')
}

/**
 * Timeline `body` JSON in words:
 * `{"fields":["BUDGET","DATETIME"]}` → "Changed: budget, datetime";
 * `{"reason":"SLASHIE"}` → "Reason: suspended by Slashie" (or "Reason: poster's account suspended");
 * other JSON as is.
 */
export function timelineBody(body: string | null | undefined): string {
  const raw = body?.trim()
  if (!raw) return ''
  try {
    const data = JSON.parse(raw) as { fields?: unknown; reason?: unknown }
    const parts: string[] = []
    if (Array.isArray(data.fields) && data.fields.length > 0) {
      parts.push(`Changed: ${data.fields.map(lowerWords).join(', ')}`)
    }
    if (typeof data.reason === 'string' && data.reason.trim()) {
      const reason = data.reason.trim()
      parts.push(`Reason: ${SUSPENSION_REASONS[reason] ?? lowerWords(reason)}`)
    }
    if (parts.length > 0) return parts.join(' · ')
  } catch {
    // Not JSON: show it as sent.
  }
  return raw
}

export function activityFromDossier(
  activity: Array<ActivityLike | null | undefined> | null | undefined,
): ActivityRow[] {
  const rows: ActivityRow[] = []
  for (const item of activity ?? []) {
    if (!item) continue
    const kind: ActivityRow['kind'] =
      String(item.source || '').toUpperCase() === 'FLASH' ? 'flash' : 'timeline'
    const meta = [
      item.actorUserId ? `Actor: ${item.actorUserId}` : '',
      item.visibleToUserIds?.length
        ? `Visible to: ${item.visibleToUserIds.join(', ')}`
        : '',
    ]
      .filter(Boolean)
      .join(' · ')
    const timeline = kind === 'timeline'
    rows.push({
      id: `${kind}-${item.type}-${item.createdAt}-${rows.length}`,
      // Timeline rows carry the raw event type as the title and JSON data as the body.
      // A flash without a title falls back to its type in words (`TASK_REOPENED` → "Task reopened").
      title: timeline
        ? timelineTitle(item.type)
        : item.title?.trim() || timelineTitle(item.type),
      body: [timeline ? timelineBody(item.body) : item.body?.trim(), meta]
        .filter(Boolean)
        .join(' · '),
      at: String(item.createdAt ?? ''),
      kind,
    })
  }
  return rows.sort((a, b) => (Date.parse(b.at) || 0) - (Date.parse(a.at) || 0))
}

export function formatWhen(value: unknown): string {
  if (value == null || value === '') return '—'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

export function formatMoney(
  amount?: number | null,
  currency?: string | null,
): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  return `${currency ?? ''} ${amount}`.trim()
}
