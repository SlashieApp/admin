import { describe, expect, it } from 'vitest'

import {
  activityFromDossier,
  displayName,
  linkedWorkersFromDossier,
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
  it('merges notifications and timeline, newest first', () => {
    const rows = activityFromDossier({
      activity: [
        {
          source: 'NOTIFICATION',
          type: 'QUOTE_RECEIVED',
          title: 'New quote',
          body: '£80',
          createdAt: '2026-09-14T12:00:00.000Z',
        },
      ],
      timeline: [
        {
          type: 'TASK_CREATED',
          timestamp: '2026-09-14T10:00:00.000Z',
          actor: { id: 'u1', email: 'a@x.com' },
        },
        {
          type: 'TASK_UPDATED',
          timestamp: '2026-09-14T13:00:00.000Z',
          actor: { id: 'u1', email: 'a@x.com' },
        },
      ],
    })

    expect(rows.map((row) => row.title)).toEqual([
      'TASK_UPDATED',
      'New quote',
      'TASK_CREATED',
    ])
    expect(rows[1]?.kind).toBe('notification')
  })

  it('maps AdminTaskActivity TIMELINE source without nested actor', () => {
    const rows = activityFromDossier({
      activity: [
        {
          source: 'TIMELINE',
          type: 'TASK_UPDATED',
          actorUserId: 'u1',
          createdAt: '2026-09-14T13:00:00.000Z',
        },
      ],
    })
    expect(rows).toEqual([
      {
        id: 'timeline-TASK_UPDATED-2026-09-14T13:00:00.000Z-0',
        title: 'TASK_UPDATED',
        body: 'Actor: u1',
        at: '2026-09-14T13:00:00.000Z',
        kind: 'timeline',
      },
    ])
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
