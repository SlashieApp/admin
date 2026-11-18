'use client'

import { useState } from 'react'

import { ConfirmAction } from '@/components/ConfirmAction'
import {
  AdminEndWorkerPro,
  AdminSetWorkerPro,
} from '@/graphql/operations'
import { apolloClient } from '@/lib/apollo'
import { graphqlErrorMessage } from '@/lib/graphqlErrors'
import { membershipStatusLine } from '@/lib/membershipStatus'
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
  AdminEndWorkerProMutation,
  AdminSetWorkerProMutation,
  AdminUserDetailQuery,
} from '@codegen/schema'

type Worker = NonNullable<
  AdminUserDetailQuery['adminUsers']['items'][number]['worker']
>

/**
 * Give a worker Slashie Pro (BE-117): until a date or with no end, as if
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

  const given = worker.adminPro as AdminUnlimitedView
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
      await apolloClient.mutate<AdminSetWorkerProMutation>({
        mutation: AdminSetWorkerPro,
        variables: { userId, until: chosen.until?.toISOString() ?? null },
      })
      setDone('Slashie Pro given.')
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
      await apolloClient.mutate<AdminEndWorkerProMutation>({
        mutation: AdminEndWorkerPro,
        variables: { userId },
      })
      setDone('Slashie Pro ended.')
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
      <h3>Slashie Pro</h3>
      <dl className="kv">
        <div>
          <dt>Plan</dt>
          <dd>
            {membership.planName} · {membershipStatusLine(membership)}
          </dd>
        </div>
        <div>
          <dt>Quotes this month</dt>
          <dd>
            {membership.hasPro
              ? `${membership.quotesUsedThisMonth} (no limit)`
              : `${membership.quotesUsedThisMonth} of ${membership.freeQuotesPerMonth}`}
          </dd>
        </div>
      </dl>
      {given ? <p className="meta">{describeUnlimited(given)}</p> : null}
      {paid ? (
        <p className="banner banner-warn">
          {"This worker has a paid plan. Giving Slashie Pro doesn't stop their billing."}
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
        label={active ? 'Replace Slashie Pro' : 'Give Slashie Pro'}
        busyLabel="Saving…"
        confirmText={
          untilText
            ? `Give this worker Slashie Pro ${untilText}? It reads like a paid plan with no auto-renew. Nothing changes in Stripe.`
            : 'Pick an end date first.'
        }
        busy={busy}
        onConfirm={() => void give()}
      />
      {active ? (
        <ConfirmAction
          danger
          label="End Slashie Pro now"
          busyLabel="Ending…"
          confirmText="End this worker's Slashie Pro now? They go back to Free and the monthly quote limit."
          busy={busy}
          onConfirm={() => void end()}
        />
      ) : null}
    </div>
  )
}
