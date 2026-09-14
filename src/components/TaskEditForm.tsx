'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import {
  AdminTasks,
  AdminTasksLegacy,
  AdminUpdateTask,
  TaskCore,
} from '@/graphql/operations'
import { apolloClient } from '@/lib/apollo'
import {
  graphqlErrorMessage,
  isMissingAdminFieldError,
} from '@/lib/graphqlErrors'
import {
  TASK_CATEGORIES,
  TASK_STATUSES,
  buildAdminUpdateTaskInput,
  taskToFormValues,
  type TaskEditFormValues,
} from '@/lib/taskInput'
import { Currency, TaskBudgetType, TaskPaymentMethod } from '@codegen/schema'
import type {
  AdminTasksLegacyQuery,
  AdminTasksQuery,
  AdminUpdateTaskMutation,
  TaskCoreQuery,
} from '@codegen/schema'

type Props = {
  taskId: string
  hidePageHead?: boolean
}

export function TaskEditForm({ taskId, hidePageHead }: Props) {
  const router = useRouter()
  const [values, setValues] = useState<TaskEditFormValues | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveOk, setSaveOk] = useState<string | null>(null)
  const [usedFallback, setUsedFallback] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const loaded = await loadTask(taskId)
        if (cancelled) return
        setValues(taskToFormValues(loaded.task))
        setUsedFallback(loaded.fallback)
      } catch (error) {
        if (!cancelled) setLoadError(graphqlErrorMessage(error))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [taskId])

  function patch<K extends keyof TaskEditFormValues>(
    key: K,
    value: TaskEditFormValues[K],
  ) {
    setValues((current) => (current ? { ...current, [key]: value } : current))
    setSaveOk(null)
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!values) return
    setSaving(true)
    setSaveError(null)
    setSaveOk(null)
    try {
      const result = await apolloClient.mutate<AdminUpdateTaskMutation>({
        mutation: AdminUpdateTask,
        variables: {
          id: taskId,
          input: buildAdminUpdateTaskInput(values),
        },
      })
      const updated = result.data?.adminUpdateTask
      if (!updated) throw new Error('adminUpdateTask returned no task')
      setValues(taskToFormValues(updated))
      setSaveOk('Saved with god-mode adminUpdateTask.')
    } catch (error) {
      if (isMissingAdminFieldError(error)) {
        setSaveError(
          'adminUpdateTask is not on this Apollo yet (BE-42). Point NEXT_PUBLIC_GRAPHQL_URL at an API that has the @admin mutation.',
        )
      } else {
        setSaveError(graphqlErrorMessage(error))
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="muted">Loading task…</p>
  if (loadError) return <p className="banner banner-error">{loadError}</p>
  if (!values) return <p className="muted">Task not found.</p>

  return (
    <form className="stack form section" onSubmit={(e) => void onSubmit(e)}>
      {hidePageHead ? (
        <h2>God-mode edit</h2>
      ) : (
        <div className="page-head">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => router.push('/')}
          >
            ← Tasks
          </button>
          <h1>Edit task</h1>
          <p className="mono muted">{taskId}</p>
        </div>
      )}

      {usedFallback ? (
        <p className="banner banner-warn">
          Loaded via public <code>task</code> query. Save still requires BE-42{' '}
          <code>adminUpdateTask</code>.
        </p>
      ) : null}
      {saveError ? <p className="banner banner-error">{saveError}</p> : null}
      {saveOk ? <p className="banner banner-ok">{saveOk}</p> : null}

      <label className="field">
        Title
        <input
          className="input"
          value={values.title}
          onChange={(e) => patch('title', e.target.value)}
          required
        />
      </label>

      <label className="field">
        Description
        <textarea
          className="input textarea"
          value={values.description}
          onChange={(e) => patch('description', e.target.value)}
          rows={6}
          required
        />
      </label>

      <div className="grid-2">
        <label className="field">
          Status
          <select
            className="input"
            value={values.status}
            onChange={(e) =>
              patch('status', e.target.value as TaskEditFormValues['status'])
            }
          >
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Category
          <select
            className="input"
            value={values.category}
            onChange={(e) => patch('category', e.target.value)}
          >
            {TASK_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
            {TASK_CATEGORIES.includes(
              values.category as (typeof TASK_CATEGORIES)[number],
            ) ? null : (
              <option value={values.category}>{values.category}</option>
            )}
          </select>
        </label>
      </div>

      <label className="check">
        <input
          type="checkbox"
          checked={values.hidden}
          onChange={(e) => patch('hidden', e.target.checked)}
        />
        Hide from marketplace
      </label>

      <fieldset className="fieldset">
        <legend>Location</legend>
        <label className="field">
          Name
          <input
            className="input"
            value={values.locationName}
            onChange={(e) => patch('locationName', e.target.value)}
          />
        </label>
        <label className="field">
          Address
          <input
            className="input"
            value={values.locationAddress}
            onChange={(e) => patch('locationAddress', e.target.value)}
          />
        </label>
        <div className="grid-2">
          <label className="field">
            Lat
            <input
              className="input"
              value={values.locationLat}
              onChange={(e) => patch('locationLat', e.target.value)}
            />
          </label>
          <label className="field">
            Lng
            <input
              className="input"
              value={values.locationLng}
              onChange={(e) => patch('locationLng', e.target.value)}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Budget</legend>
        <div className="grid-2">
          <label className="field">
            Amount
            <input
              className="input"
              type="number"
              min={0}
              step="0.01"
              value={values.budgetAmount}
              onChange={(e) => patch('budgetAmount', e.target.value)}
            />
          </label>
          <label className="field">
            Currency
            <select
              className="input"
              value={values.budgetCurrency}
              onChange={(e) =>
                patch('budgetCurrency', e.target.value as Currency)
              }
            >
              <option value={Currency.Gbp}>GBP</option>
              <option value={Currency.Usd}>USD</option>
            </select>
          </label>
        </div>
        <div className="grid-2">
          <label className="field">
            Type
            <select
              className="input"
              value={values.budgetType}
              onChange={(e) =>
                patch('budgetType', e.target.value as TaskBudgetType)
              }
            >
              <option value={TaskBudgetType.OneOff}>ONE_OFF</option>
              <option value={TaskBudgetType.PerDay}>PER_DAY</option>
              <option value={TaskBudgetType.PerHour}>PER_HOUR</option>
            </select>
          </label>
          <label className="field">
            Payment
            <select
              className="input"
              value={values.paymentMethod}
              onChange={(e) =>
                patch('paymentMethod', e.target.value as TaskPaymentMethod)
              }
            >
              <option value={TaskPaymentMethod.Cash}>CASH</option>
              <option value={TaskPaymentMethod.BankTransfer}>
                BANK_TRANSFER
              </option>
            </select>
          </label>
        </div>
      </fieldset>

      <button className="btn btn-primary" type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save god-mode update'}
      </button>
    </form>
  )
}

async function loadTask(id: string): Promise<{
  task: AdminTasksQuery['adminTasks'][number]
  fallback: boolean
}> {
  try {
    const result = await apolloClient.query<AdminTasksQuery>({
      query: AdminTasks,
      variables: { filter: { id }, first: 1 },
      fetchPolicy: 'network-only',
    })
    const task = result.data?.adminTasks?.[0]
    if (task) return { task, fallback: false }
  } catch (error) {
    if (!isMissingAdminFieldError(error)) throw error
  }

  try {
    const result = await apolloClient.query<AdminTasksLegacyQuery>({
      query: AdminTasksLegacy,
      variables: { id, search: id },
      fetchPolicy: 'network-only',
    })
    const task = result.data?.adminTasks?.[0]
    if (task) return { task, fallback: false }
  } catch (error) {
    if (!isMissingAdminFieldError(error)) throw error
  }

  const result = await apolloClient.query<TaskCoreQuery>({
    query: TaskCore,
    variables: { id },
    fetchPolicy: 'network-only',
  })
  const task = result.data?.task
  if (!task) throw new Error('Task not found')
  return { task, fallback: true }
}
