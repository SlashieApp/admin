import { describe, expect, it } from 'vitest'

import { Currency, TaskBudgetType, TaskPaymentMethod } from '@codegen/schema'

import {
  buildAdminUpdateTaskInput,
  splitCategories,
  taskToFormValues,
} from './taskInput'

describe('taskToFormValues + buildAdminUpdateTaskInput', () => {
  it('round-trips god-mode fields including hide', () => {
    const values = taskToFormValues({
      title: 'Fix tap',
      description: 'Kitchen leak',
      categories: ['Plumbing', 'Leaky tap'],
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
      categories: ['Plumbing', 'Leaky tap'],
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
      status: 'DRAFT',
    })
    expect(buildAdminUpdateTaskInput(values).location).toBeUndefined()
    expect(buildAdminUpdateTaskInput(values).budget).toBeUndefined()
    expect(buildAdminUpdateTaskInput(values).hidden).toBe(false)
  })
})

describe('splitCategories', () => {
  it('splits the typed list and drops blanks', () => {
    expect(splitCategories(' Plumbing,  Leaky tap , ,')).toEqual(['Plumbing', 'Leaky tap'])
    expect(splitCategories('')).toEqual([])
  })

  it('shows existing categories as one comma-separated field', () => {
    expect(taskToFormValues({ categories: ['Plumbing', 'Leaky tap'] }).categories).toBe(
      'Plumbing, Leaky tap',
    )
  })
})
