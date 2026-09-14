import { describe, expect, it } from 'vitest'

import { Currency, TaskBudgetType, TaskPaymentMethod } from '@codegen/schema'

import { buildAdminUpdateTaskInput, taskToFormValues } from './taskInput'

describe('taskToFormValues + buildAdminUpdateTaskInput', () => {
  it('round-trips god-mode fields including hide', () => {
    const values = taskToFormValues({
      title: 'Fix tap',
      description: 'Kitchen leak',
      category: 'HANDYMAN',
      status: 'OPEN',
      hidden: true,
      location: {
        name: 'Clapham',
        address: '1 High St',
        lat: 51.46,
        lng: -0.14,
      },
      budget: {
        amount: 80,
        currency: Currency.Gbp,
        type: TaskBudgetType.OneOff,
        paymentMethod: TaskPaymentMethod.Cash,
      },
    })

    expect(buildAdminUpdateTaskInput(values)).toEqual({
      title: 'Fix tap',
      description: 'Kitchen leak',
      category: 'HANDYMAN',
      status: 'OPEN',
      hidden: true,
      location: {
        lat: 51.46,
        lng: -0.14,
        name: 'Clapham',
        address: '1 High St',
      },
      budget: {
        amount: 80,
        currency: Currency.Gbp,
        type: TaskBudgetType.OneOff,
        paymentMethod: TaskPaymentMethod.Cash,
      },
    })
  })

  it('omits incomplete location / budget', () => {
    const values = taskToFormValues({
      title: 'Draft',
      description: 'TBD',
      category: 'GENERAL',
      status: 'DRAFT',
    })
    expect(buildAdminUpdateTaskInput(values).location).toBeUndefined()
    expect(buildAdminUpdateTaskInput(values).budget).toBeUndefined()
    expect(buildAdminUpdateTaskInput(values).hidden).toBe(false)
  })
})
