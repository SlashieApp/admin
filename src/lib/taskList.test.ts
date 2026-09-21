import { describe, expect, it } from 'vitest'

import {
  parseTaskListFilters,
  refineTasks,
  taskFiltersFromForm,
  taskListPath,
  taskPageLocalFields,
  toTaskListQueryVariables,
  type TaskListRow,
} from './taskList'

function params(query: string) {
  return new URLSearchParams(query)
}

function task(partial: Partial<TaskListRow> & Pick<TaskListRow, 'id'>): TaskListRow {
  return {
    title: 'Leaky tap',
    category: 'PLUMBING',
    status: 'OPEN',
    views: 3,
    hidden: false,
    budget: { amount: 80, currency: 'GBP', type: 'ONE_OFF' },
    datetime: { date: '2026-09-18' },
    poster: {
      id: 'u1',
      email: 'pat@x.com',
      profile: { name: 'Pat' },
    },
    ...partial,
  }
}

describe('parseTaskListFilters', () => {
  it('reads composed URL params', () => {
    const filters = parseTaskListFilters(
      params(
        'q=tap&status=OPEN&visibility=hidden&category=PLUMBING&poster=pat&budgetMin=20&budgetMax=100&budgetType=ONE_OFF&from=2026-09-01&to=2026-09-30&first=50&sort=title&dir=asc',
      ),
    )
    expect(filters).toMatchObject({
      q: 'tap',
      status: 'OPEN',
      visibility: 'hidden',
      category: 'PLUMBING',
      poster: 'pat',
      budgetMin: 20,
      budgetMax: 100,
      budgetType: 'ONE_OFF',
      from: '2026-09-01',
      to: '2026-09-30',
      first: 50,
      sort: 'title',
      dir: 'asc',
    })
  })
})

describe('toTaskListQueryVariables', () => {
  it('sends search, status, and hidden to adminTasks', () => {
    expect(
      toTaskListQueryVariables(
        parseTaskListFilters(params('q=tap&status=OPEN&visibility=public&first=50')),
      ),
    ).toEqual({
      first: 50,
      filter: { search: 'tap', status: ['OPEN'], hidden: false },
    })
  })

  it('omits filter when only page size is set', () => {
    expect(toTaskListQueryVariables(parseTaskListFilters(params('')))).toEqual({
      first: 25,
    })
  })

  it('sends BE-49 extras including bbox until the API rejects them', () => {
    expect(
      toTaskListQueryVariables(
        parseTaskListFilters(params('category=PLUMBING&poster=pat&budgetMin=20')),
        {
          bbox: { swLat: 51.4, swLng: -0.2, neLat: 51.6, neLng: 0.1 },
        },
      ).filter,
    ).toMatchObject({
      category: 'PLUMBING',
      posterSearch: 'pat',
      budgetMin: 20,
      bbox: { swLat: 51.4, swLng: -0.2, neLat: 51.6, neLng: 0.1 },
    })
  })

  it('omits denied proposed keys on retry', () => {
    expect(
      toTaskListQueryVariables(
        parseTaskListFilters(params('category=PLUMBING&status=OPEN')),
        { denyKeys: ['category'] },
      ),
    ).toEqual({
      first: 25,
      filter: { status: ['OPEN'] },
    })
  })
})

describe('refineTasks', () => {
  const rows = [
    task({ id: '1' }),
    task({
      id: '2',
      title: 'Garden tidy',
      category: 'GARDENING',
      status: 'COMPLETED',
      budget: { amount: 200, currency: 'GBP', type: 'PER_DAY' },
      poster: { id: 'u2', email: 'lee@x.com', profile: { name: 'Lee' } },
      datetime: { date: '2026-08-01' },
    }),
  ]

  it('filters poster, category, budget, and job date on the current page', () => {
    expect(
      refineTasks(rows, parseTaskListFilters(params('poster=pat'))).map(
        (row) => row.id,
      ),
    ).toEqual(['1'])
    expect(
      refineTasks(rows, parseTaskListFilters(params('category=garden'))).map(
        (row) => row.id,
      ),
    ).toEqual(['2'])
    expect(
      refineTasks(rows, parseTaskListFilters(params('budgetMax=100'))).map(
        (row) => row.id,
      ),
    ).toEqual(['1'])
    expect(
      refineTasks(
        rows,
        parseTaskListFilters(params('from=2026-09-01&to=2026-09-30')),
      ).map((row) => row.id),
    ).toEqual(['1'])
  })

  it('sorts the current page', () => {
    expect(
      refineTasks(rows, parseTaskListFilters(params('sort=title&dir=asc'))).map(
        (row) => row.id,
      ),
    ).toEqual(['2', '1'])
  })
})

describe('taskListPath', () => {
  it('omits default params so the tasks URL stays shareable', () => {
    expect(taskListPath({})).toBe('/')
    expect(taskListPath({ q: 'tap', status: 'OPEN', first: 50 })).toBe(
      '/?q=tap&status=OPEN&first=50',
    )
  })
})

describe('taskFiltersFromForm', () => {
  it('reads the toolbar fields and keeps sort from the current URL', () => {
    const current = parseTaskListFilters(params('sort=title&dir=asc'))
    const data = new FormData()
    data.set('q', ' tap ')
    data.set('status', 'OPEN')
    data.set('poster', 'pat')
    expect(taskFiltersFromForm(data, current)).toMatchObject({
      q: 'tap',
      status: 'OPEN',
      poster: 'pat',
      sort: 'title',
      dir: 'asc',
    })
  })
})

describe('taskPageLocalFields', () => {
  it('lists only filters Apollo cannot apply', () => {
    expect(taskPageLocalFields(parseTaskListFilters(params('q=tap')))).toEqual(
      [],
    )
    expect(
      taskPageLocalFields(
        parseTaskListFilters(params('category=PLUMBING&poster=pat')),
      ),
    ).toEqual([])
    expect(
      taskPageLocalFields(
        parseTaskListFilters(params('category=PLUMBING&poster=pat')),
        ['category', 'posterSearch'],
      ),
    ).toEqual(['Category', 'Poster'])
  })
})
