import { describe, expect, it } from 'vitest'

import {
  parseTaskListFilters,
  sortTasks,
  TASK_STATUSES,
  taskFiltersFromForm,
  taskListPath,
  toTaskListQueryVariables,
  type TaskListRow,
} from './taskList'

function params(query: string) {
  return new URLSearchParams(query)
}

function task(partial: Partial<TaskListRow> & Pick<TaskListRow, 'id'>): TaskListRow {
  return {
    title: 'Leaky tap',
    categories: ['Plumbing'],
    status: 'OPEN',
    views: 3,
    suspension: null,
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
        'q=tap&status=OPEN&suspended=1&category=PLUMBING&poster=pat&budgetMin=20&budgetMax=100&budgetType=ONE_OFF&from=2026-09-01&to=2026-09-30&first=50&sort=title&dir=asc',
      ),
    )
    expect(filters).toMatchObject({
      q: 'tap',
      status: 'OPEN',
      suspended: 'yes',
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
  it('sends search, status, and suspended to adminTasks', () => {
    expect(
      toTaskListQueryVariables(
        parseTaskListFilters(params('q=tap&status=OPEN&suspended=0&first=50')),
      ),
    ).toEqual({
      first: 50,
      filter: { search: 'tap', status: ['OPEN'], suspended: false },
    })
    expect(
      toTaskListQueryVariables(parseTaskListFilters(params('suspended=1'))),
    ).toEqual({ first: 25, filter: { suspended: true } })
  })

  it('sends no suspended filter for Any, and never the deprecated hidden filter', () => {
    const any = toTaskListQueryVariables(parseTaskListFilters(params('')))
    expect(any).toEqual({ first: 25 })
    // The old visibility URL param is ignored: it no longer maps to any filter.
    const legacy = toTaskListQueryVariables(
      parseTaskListFilters(params('visibility=hidden&suspended=1')),
    )
    expect(legacy.filter).toEqual({ suspended: true })
    expect(legacy.filter).not.toHaveProperty('hidden')
  })

  it('sends every toolbar filter to adminTasks, with created-date bounds in UTC', () => {
    expect(
      toTaskListQueryVariables(
        parseTaskListFilters(
          params(
            'category=PLUMBING&poster=pat&budgetMin=20&budgetMax=100&budgetType=ONE_OFF&from=2026-09-01&to=2026-09-30&after=c2',
          ),
        ),
      ),
    ).toEqual({
      first: 25,
      after: 'c2',
      filter: {
        category: 'PLUMBING',
        posterSearch: 'pat',
        budgetMin: 20,
        budgetMax: 100,
        budgetType: 'ONE_OFF',
        createdAfter: '2026-09-01T00:00:00.000Z',
        createdBefore: '2026-09-30T23:59:59.999Z',
      },
    })
  })

  it('omits filter when only page size is set', () => {
    expect(toTaskListQueryVariables(parseTaskListFilters(params('')))).toEqual({
      first: 25,
    })
  })
})

describe('sortTasks', () => {
  it('sorts the fetched page', () => {
    const rows = [task({ id: '1' }), task({ id: '2', title: 'Garden tidy' })]
    expect(
      sortTasks(rows, parseTaskListFilters(params('sort=title&dir=asc'))).map(
        (row) => row.id,
      ),
    ).toEqual(['2', '1'])
  })

  it('sorts suspended tasks (any reason) after the rest, or first when descending', () => {
    const rows = [
      task({ id: 'ok' }),
      task({ id: 'slashie', suspension: { bySlashie: true, posterSuspended: false } }),
      task({ id: 'poster', suspension: { bySlashie: false, posterSuspended: true } }),
    ]
    expect(
      sortTasks(rows, parseTaskListFilters(params('sort=suspended&dir=asc'))).map(
        (row) => row.id,
      ),
    ).toEqual(['ok', 'slashie', 'poster'])
    expect(
      sortTasks(rows, parseTaskListFilters(params('sort=suspended&dir=desc'))).map(
        (row) => row.id,
      ),
    ).toEqual(['slashie', 'poster', 'ok'])
  })
})

describe('TASK_STATUSES', () => {
  it('matches the live TaskStatus enum (job completion lives on Order)', () => {
    expect(TASK_STATUSES).toEqual(['DRAFT', 'OPEN', 'AWARDED', 'CANCELLED'])
  })
})

describe('taskListPath', () => {
  it('omits default params so the tasks URL stays shareable', () => {
    expect(taskListPath({})).toBe('/')
    expect(taskListPath({ q: 'tap', status: 'OPEN', first: 50 })).toBe(
      '/?q=tap&status=OPEN&first=50',
    )
    expect(taskListPath({ status: 'OPEN', after: 'c2' })).toBe(
      '/?status=OPEN&after=c2',
    )
  })

  it('keeps the suspended filter in the URL, like the Users filters', () => {
    expect(taskListPath({ suspended: 'yes' })).toBe('/?suspended=1')
    expect(taskListPath({ suspended: 'no', status: 'OPEN' })).toBe(
      '/?status=OPEN&suspended=0',
    )
    expect(taskListPath({ suspended: 'all' })).toBe('/')
    expect(
      parseTaskListFilters(params(taskListPath({ suspended: 'yes' }).slice(2)))
        .suspended,
    ).toBe('yes')
  })
})

describe('taskFiltersFromForm', () => {
  it('reads the toolbar fields and keeps sort from the current URL', () => {
    const current = parseTaskListFilters(params('sort=title&dir=asc'))
    const data = new FormData()
    data.set('q', ' tap ')
    data.set('status', 'OPEN')
    data.set('poster', 'pat')
    data.set('suspended', 'no')
    expect(taskFiltersFromForm(data, current)).toMatchObject({
      q: 'tap',
      status: 'OPEN',
      poster: 'pat',
      suspended: 'no',
      sort: 'title',
      dir: 'asc',
    })
  })
})

describe('bbox filter', () => {
  it('parses and serializes the map viewport', () => {
    const filters = parseTaskListFilters(
      params('bbox=51.4,-0.2,51.6,0.1&status=OPEN'),
    )
    expect(filters.bbox).toEqual({
      swLat: 51.4,
      swLng: -0.2,
      neLat: 51.6,
      neLng: 0.1,
    })
    expect(taskListPath(filters)).toBe(
      '/?status=OPEN&bbox=51.4%2C-0.2%2C51.6%2C0.1',
    )
  })

  it('sends bbox on adminTasks', () => {
    expect(
      toTaskListQueryVariables(
        parseTaskListFilters(params('bbox=51.4,-0.2,51.6,0.1')),
      ),
    ).toEqual({
      first: 25,
      filter: {
        bbox: { swLat: 51.4, swLng: -0.2, neLat: 51.6, neLng: 0.1 },
      },
    })
  })
})
