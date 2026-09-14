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

export type ActivityRow = {
  id: string
  title: string
  body: string
  at: string
  kind: 'notification' | 'timeline'
}

type NotificationLike = {
  id?: string | null
  source?: string | null
  type?: string | null
  title?: string | null
  body?: string | null
  createdAt?: string | null
  actorUserId?: string | null
}

type TimelineLike = {
  type?: string | null
  timestamp?: string | null
  actor?: Named | null
}

export function activityFromDossier(input: {
  activity?: Array<NotificationLike | null | undefined> | null
  timeline?: Array<TimelineLike | null | undefined> | null
}): ActivityRow[] {
  const rows: ActivityRow[] = []

  for (const item of input.activity ?? []) {
    if (!item) continue
    const source = String(item.source || '').toUpperCase()
    const kind: ActivityRow['kind'] =
      source === 'TIMELINE' ? 'timeline' : 'notification'
    rows.push({
      id: item.id || `${kind}-${item.type}-${item.createdAt}-${rows.length}`,
      title: item.title?.trim() || item.type || 'Notification',
      body:
        item.body?.trim() ||
        (item.actorUserId ? `Actor: ${item.actorUserId}` : ''),
      at: String(item.createdAt ?? ''),
      kind,
    })
  }

  for (const event of input.timeline ?? []) {
    if (!event) continue
    const actor = displayName(event.actor)
    rows.push({
      id: `t-${event.type}-${event.timestamp}-${rows.length}`,
      title: event.type || 'TASK_EVENT',
      body: actor !== '—' ? `Actor: ${actor}` : '',
      at: String(event.timestamp ?? ''),
      kind: 'timeline',
    })
  }

  return rows.sort((a, b) => {
    const aTime = Date.parse(a.at) || 0
    const bTime = Date.parse(b.at) || 0
    return bTime - aTime
  })
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
