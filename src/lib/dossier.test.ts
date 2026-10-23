import { describe, expect, it } from 'vitest'

import {
  activityFromDossier,
  timelineBody,
  timelineTitle,
  displayName,
  linkedWorkersFromDossier,
  ordersNewestFirst,
} from './dossier'

describe('linkedWorkersFromDossier', () => {
  it('prefers dossier.workers then unique quote/order workers', () => {
    const rows = linkedWorkersFromDossier({
      workers: [{ id: 'w1', userId: 'u2', profile: { name: 'Pat' } }],
      quotes: [
        {
          id: 'q1',
          worker: {
            id: 'u2',
            email: 'pat@x.com',
            worker: { id: 'w1', profile: { name: 'Pat' } },
          },
        },
        {
          id: 'q2',
          worker: {
            id: 'u3',
            email: 'sam@x.com',
            worker: { id: 'w2', legalName: 'Sam Pro' },
          },
        },
      ],
      orders: [
        {
          id: 'o1',
          worker: { id: 'w2', legalName: 'Sam Pro' },
        },
      ],
    })

    expect(rows.map((row) => row.id)).toEqual(['w1', 'w2'])
    expect(rows[0]?.href).toBe('/users/u2')
    expect(rows[1]?.href).toBe('/users/u3')
  })

  it('falls back to quote user when no worker profile exists', () => {
    const rows = linkedWorkersFromDossier({
      quotes: [
        {
          id: 'q1',
          worker: { id: 'u9', email: 'solo@x.com', profile: { name: 'Solo' } },
        },
      ],
    })
    expect(rows).toEqual([
      {
        id: 'u9',
        userId: 'u9',
        label: 'Solo',
        email: 'solo@x.com',
        href: '/users/u9',
      },
    ])
  })
})

describe('activityFromDossier', () => {
  it('maps FLASH and TIMELINE rows newest first', () => {
    const rows = activityFromDossier([
      {
        source: 'FLASH',
        type: 'QUOTE_RECEIVED',
        title: 'New quote',
        body: '£80',
        visibleToUserIds: ['u1'],
        createdAt: '2026-09-14T12:00:00.000Z',
      },
      {
        source: 'TIMELINE',
        type: 'TASK_UPDATED',
        title: 'TASK_UPDATED',
        body: '{"fields":["BUDGET","DATETIME"]}',
        actorUserId: 'u1',
        createdAt: '2026-09-14T13:00:00.000Z',
      },
    ])
    expect(rows).toEqual([
      {
        id: 'timeline-TASK_UPDATED-2026-09-14T13:00:00.000Z-1',
        title: 'Task updated',
        body: 'Changed: budget, datetime · Actor: u1',
        at: '2026-09-14T13:00:00.000Z',
        kind: 'timeline',
      },
      {
        id: 'flash-QUOTE_RECEIVED-2026-09-14T12:00:00.000Z-0',
        title: 'New quote',
        body: '£80 · Visible to: u1',
        at: '2026-09-14T12:00:00.000Z',
        kind: 'flash',
      },
    ])
  })
})

describe('timeline labels', () => {
  it('turns event types and data into words', () => {
    expect(timelineTitle('RESCHEDULE_WITHDRAWN')).toBe('Reschedule withdrawn')
    expect(timelineTitle(null)).toBe('Activity')
    expect(timelineBody('{"fields":["CONTACT_METHOD"]}')).toBe('Changed: contact method')
    expect(timelineBody('{}')).toBe('{}')
    expect(timelineBody('not json')).toBe('not json')
    expect(timelineBody(null)).toBe('')
  })

  it('turns a suspension reason into words', () => {
    expect(timelineBody('{"reason":"SLASHIE"}')).toBe('Reason: suspended by Slashie')
    expect(timelineBody('{"reason":"POSTER_SUSPENDED"}')).toBe(
      "Reason: poster's account suspended",
    )
    // A reason the panel does not know yet still reads as words, not JSON.
    expect(timelineBody('{"reason":"SOMETHING_NEW"}')).toBe('Reason: something new')
    // Not a string reason: shown as sent.
    expect(timelineBody('{"reason":7}')).toBe('{"reason":7}')
  })

  it('keeps the changed fields when a row carries both', () => {
    expect(timelineBody('{"fields":["TITLE"],"reason":"SLASHIE"}')).toBe(
      'Changed: title · Reason: suspended by Slashie',
    )
  })
})

describe('activityFromDossier suspension and reopen rows (BE-108)', () => {
  it('reads suspended, unsuspended and reopened timeline rows', () => {
    const rows = activityFromDossier([
      {
        source: 'TIMELINE',
        type: 'TASK_SUSPENDED',
        title: 'TASK_SUSPENDED',
        body: '{"reason":"SLASHIE"}',
        actorUserId: 'admin1',
        createdAt: '2026-10-01T09:00:00.000Z',
      },
      {
        source: 'TIMELINE',
        type: 'TASK_SUSPENDED',
        body: '{"reason":"POSTER_SUSPENDED"}',
        createdAt: '2026-10-02T09:00:00.000Z',
      },
      {
        source: 'TIMELINE',
        type: 'TASK_UNSUSPENDED',
        body: '{"reason":"SLASHIE"}',
        actorUserId: 'admin1',
        createdAt: '2026-10-03T09:00:00.000Z',
      },
      {
        source: 'TIMELINE',
        type: 'TASK_REOPENED',
        body: '{}',
        actorUserId: 'u1',
        createdAt: '2026-10-04T09:00:00.000Z',
      },
    ])
    expect(rows.map((row) => [row.title, row.body])).toEqual([
      ['Task reopened', '{} · Actor: u1'],
      ['Task unsuspended', 'Reason: suspended by Slashie · Actor: admin1'],
      ['Task suspended', "Reason: poster's account suspended"],
      ['Task suspended', 'Reason: suspended by Slashie · Actor: admin1'],
    ])
  })

  it('reads the TASK_CANCELLED and TASK_REOPENED flashes, with or without a title', () => {
    const rows = activityFromDossier([
      {
        source: 'FLASH',
        type: 'TASK_CANCELLED',
        title: 'Task cancelled',
        body: 'The owner cancelled the task.',
        visibleToUserIds: ['w1'],
        createdAt: '2026-10-05T09:00:00.000Z',
      },
      {
        source: 'FLASH',
        type: 'TASK_REOPENED',
        title: null,
        body: null,
        visibleToUserIds: ['w1', 'w2'],
        createdAt: '2026-10-06T09:00:00.000Z',
      },
    ])
    expect(rows.map((row) => [row.kind, row.title, row.body])).toEqual([
      ['flash', 'Task reopened', 'Visible to: w1, w2'],
      ['flash', 'Task cancelled', 'The owner cancelled the task. · Visible to: w1'],
    ])
  })
})

describe('orders after a reopen', () => {
  it('lists the newest order first and keeps both', () => {
    const orders = [
      { id: 'old', status: 'CANCELLED', createdAt: '2026-09-01T10:00:00.000Z' },
      { id: 'new', status: 'ACTIVE', createdAt: '2026-09-20T10:00:00.000Z' },
    ]
    expect(ordersNewestFirst(orders).map((order) => order.id)).toEqual(['new', 'old'])
    // The input is left alone.
    expect(orders.map((order) => order.id)).toEqual(['old', 'new'])
    expect(ordersNewestFirst(null)).toEqual([])
    expect(ordersNewestFirst([])).toEqual([])
  })

  it('keeps the API order when created times tie or are missing', () => {
    const orders = [
      { id: 'a', createdAt: null },
      { id: 'b', createdAt: null },
    ]
    expect(ordersNewestFirst(orders).map((order) => order.id)).toEqual(['a', 'b'])
  })

  it('links one worker once when both orders are theirs', () => {
    const rows = linkedWorkersFromDossier({
      orders: [
        { id: 'new', workerUserId: 'u7' },
        { id: 'old', workerUserId: 'u7' },
        { id: 'older', workerUserId: 'u8' },
      ],
    })
    expect(rows.map((row) => row.id)).toEqual(['u7', 'u8'])
  })
})

describe('displayName', () => {
  it('prefers profile name then legal name then email then id', () => {
    expect(displayName({ profile: { name: 'Alex' }, email: 'a@x.com' })).toBe(
      'Alex',
    )
    expect(displayName({ legalName: 'Pat Pro', id: 'w1' })).toBe('Pat Pro')
    expect(displayName({ email: 'a@x.com', id: 'u1' })).toBe('a@x.com')
    expect(displayName({ id: 'x' })).toBe('x')
  })
})
