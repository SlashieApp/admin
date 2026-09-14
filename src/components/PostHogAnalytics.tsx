'use client'

import { useEffect, useState } from 'react'

import { formatWhen } from '@/lib/dossier'
import { isIncompleteSuccessCapture, productEventLabel } from '@/lib/posthogEvents'

type AnalyticsPayload = {
  configured: boolean
  error?: string
  events: Array<{ timestamp: string; event: string; distinctId: string }>
  counts: Array<{ event: string; count: number; users: number }>
}

type Props =
  | { kind: 'user'; userId: string; email?: string | null }
  | { kind: 'task'; taskId: string }

export function PostHogAnalytics(props: Props) {
  const [data, setData] = useState<AnalyticsPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const kind = props.kind
  const userId = props.kind === 'user' ? props.userId : ''
  const email = props.kind === 'user' ? (props.email ?? '') : ''
  const taskId = props.kind === 'task' ? props.taskId : ''

  useEffect(() => {
    let cancelled = false
    const path =
      kind === 'user'
        ? `/api/admin/posthog/person?userId=${encodeURIComponent(userId)}${
            email ? `&email=${encodeURIComponent(email)}` : ''
          }`
        : `/api/admin/posthog/task?taskId=${encodeURIComponent(taskId)}`

    async function load() {
      try {
        const response = await fetch(path, { credentials: 'same-origin' })
        const payload = (await response.json()) as AnalyticsPayload & {
          error?: string
        }
        if (cancelled) return
        if (!response.ok) {
          throw new Error(payload.error || `HTTP ${response.status}`)
        }
        setData(payload)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'PostHog request failed')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [kind, userId, email, taskId])

  return (
    <article className="section">
      <h2>Analytics</h2>
      <p className="muted">
        PostHog last 30 days
        {props.kind === 'user'
          ? ' for this user id (email fallback if identified that way).'
          : ' for events with task_id / taskId.'}{' '}
        Some <code>*_success</code> names may be incomplete until FE-153.
      </p>
      {loading ? <p className="muted">Loading analytics…</p> : null}
      {error ? <p className="banner banner-error">{error}</p> : null}
      {data && !data.configured ? (
        <p className="banner banner-warn">
          PostHog env is not set on this deployment, so there is no product
          analytics to show.
        </p>
      ) : null}
      {data?.error ? <p className="banner banner-error">{data.error}</p> : null}
      {data?.configured && !data.error && !loading ? (
        <>
          {data.counts.length ? (
            <ul className="list">
              {data.counts.map((row) => (
                <li key={row.event} className="card card-pad">
                  <div className="card-top">
                    <strong>
                      {productEventLabel(row.event)}
                      {isIncompleteSuccessCapture(row.event) ? (
                        <span className="pill">FE-153</span>
                      ) : null}
                    </strong>
                    <span className="pill">{row.count}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No PostHog events in the last 30 days.</p>
          )}
          {data.events.length ? (
            <ul className="list">
              {data.events.map((row, index) => (
                <li
                  key={`${row.timestamp}-${row.event}-${index}`}
                  className="card card-pad"
                >
                  <div className="card-top">
                    <strong>{row.event}</strong>
                    <span className="pill">{formatWhen(row.timestamp)}</span>
                  </div>
                  <p className="meta mono">{row.distinctId}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </article>
  )
}
