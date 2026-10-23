import { describe, expect, it } from 'vitest'

import {
  isSuspendedBySlashie,
  isTaskSuspended,
  suspendTaskConfirm,
  suspensionReason,
  suspensionSentence,
  taskSuspensionResult,
  unsuspendTaskConfirm,
  userDisabledConfirm,
  userDisabledResult,
} from './suspension'

const slashie = { bySlashie: true, posterSuspended: false }
const poster = { bySlashie: false, posterSuspended: true }
const both = { bySlashie: true, posterSuspended: true }

describe('task suspension state', () => {
  it('is suspended for either reason, and not when null', () => {
    expect(isTaskSuspended(slashie)).toBe(true)
    expect(isTaskSuspended(poster)).toBe(true)
    expect(isTaskSuspended(both)).toBe(true)
    expect(isTaskSuspended(null)).toBe(false)
    expect(isTaskSuspended(undefined)).toBe(false)
    expect(isTaskSuspended({ bySlashie: false, posterSuspended: false })).toBe(false)
  })

  it('only a Slashie suspension is the one the button lifts', () => {
    expect(isSuspendedBySlashie(slashie)).toBe(true)
    expect(isSuspendedBySlashie(both)).toBe(true)
    expect(isSuspendedBySlashie(poster)).toBe(false)
    expect(isSuspendedBySlashie(null)).toBe(false)
  })

  it('says which reason applies', () => {
    expect(suspensionReason(slashie)).toBe('by Slashie')
    expect(suspensionReason(poster)).toBe("because the poster's account is suspended")
    expect(suspensionReason(both)).toBe(
      "by Slashie and because the poster's account is suspended",
    )
    expect(suspensionReason(null)).toBe('')
    expect(suspensionSentence(slashie)).toBe('Slashie suspended this task.')
    expect(suspensionSentence(poster)).toBe(
      "This task is suspended because the poster's account is suspended.",
    )
    expect(suspensionSentence(both)).toBe(
      "Slashie suspended this task, and the poster's account is suspended too.",
    )
    expect(suspensionSentence(null)).toBe('')
  })
})

describe('suspend task copy', () => {
  it('uses the agreed confirm text', () => {
    expect(suspendTaskConfirm(null)).toBe(
      'Suspend this task? It disappears from search, and its quotes and bookings are frozen until you unsuspend it.',
    )
  })

  it('warns when the poster is already suspended', () => {
    expect(suspendTaskConfirm(poster)).toContain('already suspended')
    expect(unsuspendTaskConfirm(both)).toContain(
      'stays suspended until that account is re-enabled',
    )
    expect(unsuspendTaskConfirm(slashie)).not.toContain("poster's account")
  })

  it('tells the admin when unsuspending leaves the poster suspension in place', () => {
    expect(taskSuspensionResult(true, slashie)).toBe('Task suspended.')
    expect(taskSuspensionResult(false, null)).toBe('Task unsuspended.')
    expect(taskSuspensionResult(false, poster)).toContain(
      "stays suspended because the poster's account is suspended",
    )
  })
})

describe('disable user copy', () => {
  it('says disabling suspends their tasks and freezes quotes and bookings', () => {
    const text = userDisabledConfirm(true)
    expect(text).toContain('suspends every task they posted')
    expect(text).toContain('freezes their quotes and bookings')
    expect(text).toContain('not tasks Slashie suspended directly')
    expect(userDisabledResult(true)).toContain('quotes and bookings are frozen')
  })

  it('says re-enabling keeps tasks Slashie suspended directly', () => {
    expect(userDisabledConfirm(false)).toContain(
      'Tasks Slashie suspended directly stay suspended',
    )
    expect(userDisabledResult(false)).toContain(
      'Tasks Slashie suspended directly stay suspended',
    )
  })
})

describe('copy has no em dashes', () => {
  it('keeps new UI copy free of em dashes', () => {
    const copy = [
      suspendTaskConfirm(both),
      unsuspendTaskConfirm(both),
      userDisabledConfirm(true),
      userDisabledConfirm(false),
      userDisabledResult(true),
      userDisabledResult(false),
      taskSuspensionResult(false, both),
      suspensionSentence(both),
      suspensionReason(both),
    ]
    for (const text of copy) expect(text).not.toContain('\u2014')
  })
})
