import { describe, expect, it } from 'vitest'

import { hogqlString } from './hogql'
import {
  DASHBOARD_PRODUCT_EVENTS,
  isIncompleteSuccessCapture,
} from './posthogEvents'

describe('hogqlString', () => {
  it('quotes and escapes values for HogQL literals', () => {
    expect(hogqlString(`abc`)).toBe(`'abc'`)
    expect(hogqlString(`o'reilly`)).toBe(`'o\\'reilly'`)
  })
})

describe('DASHBOARD_PRODUCT_EVENTS', () => {
  it('includes canonical marketplace success names', () => {
    const names = DASHBOARD_PRODUCT_EVENTS.map((row) => row.event)
    expect(names).toEqual(
      expect.arrayContaining([
        'register_success',
        'login_success',
        'google_login_success',
        'task_create_success',
        'task_view',
        'worker_setup_success',
        'quote_send_success',
        'quote_accept_success',
        'job_verify_success',
        'job_done_success',
        '$pageview',
      ]),
    )
  })

  it('flags FE-153 incomplete success captures', () => {
    expect(isIncompleteSuccessCapture('register_success')).toBe(true)
    expect(isIncompleteSuccessCapture('task_create_success')).toBe(false)
    expect(isIncompleteSuccessCapture('$pageview')).toBe(false)
  })
})
