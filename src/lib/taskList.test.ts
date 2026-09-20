import { describe, expect, it } from 'vitest'

import { TaskBudgetType, TaskStatus } from '@codegen/schema'
import { DEFAULT_ADMIN_PAGE_SIZE } from './search'
import {
  applyTaskClientFilters,
  parseTaskListFilters,
  sortTaskRows,
  taskClientFilterActive,
  taskListPath,
  toAdminTaskListVariablesFromFilters,
  type TaskListFilters,
  type TaskListRow,
} from './taskList'

function filters(partial: Partial<TaskListFilters> = {}): TaskListFilters {
  return parseTaskListFilters(new URLSearchParams(partial as Record<string, string>))
}

function task(partial: Partial<TaskListRow> & Pick<TaskListRow, 'id'>): TaskListRow {
  return {
    title: 'Leaky tap',
    category: 'PLUMBING',
    status: 'OPEN',
    views: 3,
    poster: { id: 'u1', email: 'pat@x.com', profile: { name: 'Pat' } },
    budget: { amount: 80, currency: 'GBP', type: 'ONE_OFF' },
    datetime: { date: '2026-09-18' },
    ...partial,
  }
}

describe('parseTaskListFilters + taskListPath', () => {
  it('round-trips composed filters on the tasks URL', () => {
    const parsed = parseTaskListFilters(
      new URLSearchParams(
        'q=tap&category=PLUMBING&poster=pat&status=OPEN&budgetMin=20&budgetMax=100&budgetType=ONE_OFF&hidden=yes&from=2026-09-01&to=2026-09-20&sort=budget&dir=desc&first=25',
      ),
    )
    expect(parsed.q).toBe('tap')
    expect(parsed.status).toBe(TaskStatus.Open)
    expect(parsed.budgetType).toBe(TaskBudgetType.OneOff)
    expect(parsed.hidden).toBe('yes')
    expect(parsed.first).toBe(25)
    expect(taskListPath(parsed)).toBe(
      '/?q=tap&category=PLUMBING&poster=pat&status=OPEN&budgetMin=20&budgetMax=100&budgetType=ONE_OFF&hidden=yes&from=2026-09-01&to=2026-09-20&sort=budget&dir=desc&first=25',
    )
  })

  it('omits defaults so a bare tasks list stays /', () => {
    expect(taskListPath({})).toBe('/')
  })
})

describe('toAdminTaskListVariablesFromFilters', () => {
  it('sends only AdminTaskFilter fields the API already has', () => {
    expect(toAdminTaskListVariablesFromFilters(filters())).toEqual({
      first: DEFAULT_ADMIN_PAGE_SIZE,
    })
    expect(
      toAdminTaskListVariablesFromFilters(
        parseTaskListFilters(
          new URLSearchParams('q=leaky&status=OPEN&hidden=yes'),
        ),
      ),
    ).toEqual({
      first: DEFAULT_ADMIN_PAGE_SIZE,
      filter: { search: 'leaky', status: ['OPEN'], hidden: true },
    })
  })
})

describe('applyTaskClientFilters', () => {
  const rows = [
    task({ id: '1' }),
    task({
      id: '2',
      title: 'Garden',
      category: 'GARDENING',
      poster: { id: 'u2', email: 'sam@x.com', profile: { name: 'Sam' } },
      budget: { amount: 200, currency: 'GBP', type: 'PER_DAY' },
      datetime: { date: '2026-08-01' },
    }),
  ]

  it('composes category, poster, budget, and date on the fetched page', () => {
    expect(
      applyTaskClientFilters(rows, parseTaskListFilters(new URLSearchParams('category=PLUMBING'))).map(
        (row) => row.id,
      ),
    ).toEqual(['1'])
    expect(
      applyTaskClientFilters(rows, parseTaskListFilters(new URLSearchParams('poster=sam'))).map(
        (row) => row.id,
      ),
    ).toEqual(['2'])
    expect(
      applyTaskClientFilters(rows, parseTaskListFilters(new URLSearchParams('budgetMax=100'))).map(
        (row) => row.id,
      ),
    ).toEqual(['1'])
    expect(
      applyTaskClientFilters(
        rows,
        parseTaskListFilters(new URLSearchParams('from=2026-09-01')),
      ).map((row) => row.id),
    ).toEqual(['1'])
  })
})

describe('sortTaskRows', () => {
  it('sorts the current page by budget', () => {
    const rows = sortTaskRows(
      [task({ id: 'hi', budget: { amount: 90, currency: 'GBP', type: 'ONE_OFF' } }), task({ id: 'lo', budget: { amount: 10, currency: 'GBP', type: 'ONE_OFF' } })],
      parseTaskListFilters(new URLSearchParams('sort=budget&dir=asc')),
    )
    expect(rows.map((row) => row.id)).toEqual(['lo', 'hi'])
  })
})

describe('taskClientFilterActive', () => {
  it('is true only for filters the API cannot apply', () => {
    expect(taskClientFilterActive(filters())).toBe(false)
    expect(
      taskClientFilterActive(parseTaskListFilters(new URLSearchParams('poster=pat'))),
    ).toBe(true)
  })
})
