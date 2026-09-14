'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { AdminWorkers, Worker } from '@/graphql/operations'
import { apolloClient } from '@/lib/apollo'
import {
  graphqlErrorMessage,
  isMissingAdminFieldError,
} from '@/lib/graphqlErrors'
import type { AdminWorkersQuery, WorkerQuery } from '@codegen/schema'

type WorkerRow = NonNullable<AdminWorkersQuery['adminWorkers']>[number]

export function WorkerSummary({ workerId }: { workerId: string }) {
  const router = useRouter()
  const [worker, setWorker] = useState<WorkerRow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [usedFallback, setUsedFallback] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const loaded = await loadWorker(workerId)
        if (!cancelled) {
          setWorker(loaded.worker)
          setUsedFallback(loaded.fallback)
        }
      } catch (err) {
        if (!cancelled) setError(graphqlErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [workerId])

  if (loading) return <p className="muted">Loading worker…</p>
  if (error) return <p className="banner banner-error">{error}</p>
  if (!worker) return <p className="muted">Worker not found.</p>

  const name = worker.profile?.name || worker.legalName || worker.id

  return (
    <section className="stack">
      <div className="page-head">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => router.push('/')}
        >
          ← Search
        </button>
        <h1>{name}</h1>
        <p className="mono muted">{worker.id}</p>
      </div>

      {usedFallback ? (
        <p className="banner banner-warn">
          Loaded via public <code>worker</code> query (BE-42 adminWorkers not on
          this API yet).
        </p>
      ) : null}

      <dl className="kv">
        <div>
          <dt>Email</dt>
          <dd>{worker.user?.email ?? '—'}</dd>
        </div>
        <div>
          <dt>Verified</dt>
          <dd>{worker.isVerified ? 'yes' : 'no'}</dd>
        </div>
        <div>
          <dt>Identity</dt>
          <dd>{worker.identityVerification ?? '—'}</dd>
        </div>
        <div>
          <dt>Category</dt>
          <dd>{worker.primaryCategory ?? '—'}</dd>
        </div>
        <div>
          <dt>Experience</dt>
          <dd>
            {worker.yearsExperience != null
              ? `${worker.yearsExperience} years`
              : '—'}
          </dd>
        </div>
        <div>
          <dt>Jobs completed</dt>
          <dd>{worker.tasksCompletedCount ?? '—'}</dd>
        </div>
        <div>
          <dt>Rating</dt>
          <dd>
            {worker.ratingSummary
              ? `${worker.ratingSummary.average ?? '—'} (${worker.ratingSummary.count})`
              : '—'}
          </dd>
        </div>
        <div>
          <dt>Area</dt>
          <dd>
            {worker.serviceAreaLabel ||
              worker.preferredLocation?.name ||
              '—'}
          </dd>
        </div>
      </dl>

      {worker.tagline ? <p>{worker.tagline}</p> : null}
      {worker.bio ? <p className="muted">{worker.bio}</p> : null}
      {worker.skills?.length ? (
        <p className="meta">Skills: {worker.skills.join(', ')}</p>
      ) : null}
    </section>
  )
}

async function loadWorker(id: string): Promise<{
  worker: WorkerRow
  fallback: boolean
}> {
  try {
    const result = await apolloClient.query<AdminWorkersQuery>({
      query: AdminWorkers,
      variables: { id, search: id },
      fetchPolicy: 'network-only',
    })
    const worker = result.data?.adminWorkers?.[0]
    if (worker) return { worker, fallback: false }
  } catch (error) {
    if (!isMissingAdminFieldError(error)) throw error
  }

  const result = await apolloClient.query<WorkerQuery>({
    query: Worker,
    variables: { id },
    fetchPolicy: 'network-only',
  })
  const worker = result.data?.worker
  if (!worker) throw new Error('Worker not found')
  return { worker, fallback: true }
}
