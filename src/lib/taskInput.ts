import type { AdminUpdateTaskInput } from '@codegen/schema'
import {
  Currency,
  TaskBudgetType,
  TaskPaymentMethod,
  TaskStatus,
} from '@codegen/schema'

export const TASK_STATUSES = Object.values(TaskStatus)

export const TASK_CATEGORIES = [
  'GENERAL',
  'DELIVERY',
  'HANDYMAN',
  'TECH_SETUP',
  'CLEANING',
  'MOVING',
] as const

export type TaskEditFormValues = {
  title: string
  description: string
  category: string
  status: TaskStatus
  hidden: boolean
  locationName: string
  locationAddress: string
  locationLat: string
  locationLng: string
  budgetAmount: string
  budgetCurrency: Currency
  budgetType: TaskBudgetType
  paymentMethod: TaskPaymentMethod
}

export type TaskEditSource = {
  title?: string | null
  description?: string | null
  category?: string | null
  status?: TaskStatus | string | null
  hidden?: boolean | null
  location?: {
    name?: string | null
    address?: string | null
    lat?: number | null
    lng?: number | null
  } | null
  budget?: {
    amount?: number | null
    currency?: Currency | string | null
    type?: TaskBudgetType | string | null
    paymentMethod?: TaskPaymentMethod | string | null
  } | null
}

function asEnum<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  const raw = value?.trim()
  return raw && (allowed as readonly string[]).includes(raw)
    ? (raw as T)
    : fallback
}

export function taskToFormValues(task: TaskEditSource): TaskEditFormValues {
  return {
    title: task.title?.trim() ?? '',
    description: task.description?.trim() ?? '',
    category: task.category?.trim() || 'GENERAL',
    status: asEnum(task.status ?? undefined, TASK_STATUSES, TaskStatus.Open),
    hidden: Boolean(task.hidden),
    locationName: task.location?.name?.trim() ?? '',
    locationAddress: task.location?.address?.trim() ?? '',
    locationLat:
      typeof task.location?.lat === 'number' ? String(task.location.lat) : '',
    locationLng:
      typeof task.location?.lng === 'number' ? String(task.location.lng) : '',
    budgetAmount:
      typeof task.budget?.amount === 'number' ? String(task.budget.amount) : '',
    budgetCurrency: asEnum(
      task.budget?.currency ?? undefined,
      Object.values(Currency),
      Currency.Gbp,
    ),
    budgetType: asEnum(
      task.budget?.type ?? undefined,
      Object.values(TaskBudgetType),
      TaskBudgetType.OneOff,
    ),
    paymentMethod: asEnum(
      task.budget?.paymentMethod ?? undefined,
      Object.values(TaskPaymentMethod),
      TaskPaymentMethod.Cash,
    ),
  }
}

export function buildAdminUpdateTaskInput(
  values: TaskEditFormValues,
): AdminUpdateTaskInput {
  const lat = Number.parseFloat(values.locationLat)
  const lng = Number.parseFloat(values.locationLng)
  const amount = Number.parseFloat(values.budgetAmount)

  const input: AdminUpdateTaskInput = {
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category.trim(),
    status: values.status,
    hidden: values.hidden,
  }

  if (Number.isFinite(lat) && Number.isFinite(lng) && values.locationName.trim()) {
    input.location = {
      lat,
      lng,
      name: values.locationName.trim(),
      address: values.locationAddress.trim() || values.locationName.trim(),
    }
  }

  if (Number.isFinite(amount) && amount > 0) {
    input.budget = {
      amount,
      currency: values.budgetCurrency,
      type: values.budgetType,
      paymentMethod: values.paymentMethod,
    }
  }

  return input
}
