'use client'

import { useState } from 'react'

import { ConfirmAction } from '@/components/ConfirmAction'
import {
  AdminEndWorkerUnlimited,
  AdminSetWorkerUnlimited,
} from '@/graphql/operations'
import { apolloClient } from '@/lib/apollo'
import { graphqlErrorMessage } from '@/lib/graphqlErrors'
import {
  type AdminUnlimitedView,
  describeUnlimited,
  hasPaidPlan,
  UNLIMITED_LENGTHS,
  type UnlimitedLength,
  unlimitedIsActive,
  unlimitedUntil,
} from '@/lib/unlimited'
import type {
  AdminEndWorkerUnlimitedMutation,
  AdminSetWorkerUnlimitedMutation,
  AdminUserDetailQuery,
} from '@codegen/schema'

type Worker = NonNullable<
  AdminUserDetailQuery['adminUsers']['items'][number]['worker']
>

/**
 * Give a worker Unlimited quotes (BE-117): until a date or with no end, as if
 * they had paid with no auto-renew. Stripe is never touched, so a worker who
 * already pays keeps paying. `onChanged` reloads the user.
 */
export function WorkerUnlimited({
  userId,
  worker,
  onChanged,
}: {
  userId: string
  worker: Worker
  onChanged: () => void
}) {
  const [length, setLength] = useState<UnlimitedLength>('1m')
  const [date, setDate] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const given = worker.adminUnlimited as AdminUnlimitedView
  const active = unlimitedIsActive(given)
  const paid = hasPaidPlan(worker.membership, given)
  const membership = worker.membership
  const chosen = unlimitedUntil(length, date)

  async function give() {
    if ('error' in chosen) {
      setError(chosen.error)
      return
    }
    setBusy(true)
    setError(null)
    setDone(null)
    try {
      await apolloClient.mutate<AdminSetWorkerUnlimitedMutation>({
        mutation: AdminSetWorkerUnlimited,
        variables: { userId, until: chosen.until?.toISOString() ?? null },
      })
      setDone('Unlimited given.')
      onChanged()
    } catch (err) {
      setError(graphqlErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function end() {
    setBusy(true)
    setError(null)
    setDone(null)
    try {
      await apolloClient.mutate<AdminEndWorkerUnlimitedMutation>({
        mutation: AdminEndWorkerUnlimited,
        variables: { userId },
      })
      setDone('Unlimited ended.')
      onChanged()
    } catch (err) {
      setError(graphqlErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const untilText =
    'error' in chosen
      ? null
      : chosen.until
        ? `until ${chosen.until.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
        : 'with no end'

  return (
    <div className="stack">
      <h3>Unlimited quotes</h3>
      <dl className="kv">
        <div>
          <dt>Plan</dt>
          <dd>
            {membership.planName} · {membership.statusLabel}
            {membership.statusDescription ? ` · ${membership.statusDescription}` : ''}
          </dd>
        </div>
        <div>
          <dt>Quotes this month</dt>
          <dd>
            {membership.hasUnlimitedQuotes
              ? `${membership.quotesUsedThisMonth} (no limit)`
              : `${membership.quotesUsedThisMonth} of ${membership.freeQuotesPerMonth}`}
          </dd>
        </div>
      </dl>
      {given ? <p className="meta">{describeUnlimited(given)}</p> : null}
      {paid ? (
        <p className="banner banner-warn">
          {"This worker has a paid plan. Giving Unlimited doesn't stop their billing."}
        </p>
      ) : null}
      {error ? <p className="banner banner-error">{error}</p> : null}
      {done ? <p className="banner banner-ok">{done}</p> : null}

      <label className="field">
        How long
        <select
          className="input"
          value={length}
          onChange={(e) => {
            setLength(e.target.value as UnlimitedLength)
            setError(null)
          }}
        >
          {UNLIMITED_LENGTHS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {length === 'date' ? (
        <label className="field">
          End date
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              setError(null)
            }}
          />
        </label>
      ) : null}
      <ConfirmAction
        label={active ? 'Replace Unlimited' : 'Give Unlimited'}
        busyLabel="Saving…"
        confirmText={
          untilText
            ? `Give this worker Unlimited quotes ${untilText}? It reads like a paid plan with no auto-renew. Nothing changes in Stripe.`
            : 'Pick an end date first.'
        }
        busy={busy}
        onConfirm={() => void give()}
      />
      {active ? (
        <ConfirmAction
          danger
          label="End Unlimited now"
          busyLabel="Ending…"
          confirmText="End this worker's Unlimited now? They go back to Free and the monthly quote limit."
          busy={busy}
          onConfirm={() => void end()}
        />
      ) : null}
    </div>
  )
}
