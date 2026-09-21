import { describe, expect, it } from 'vitest'

import {
  isRelatedTaskFeedback,
  isRelatedTaskReport,
  liveTaskHref,
  parseTaskDossierTab,
  relatedFeedbackLink,
  relatedReportLink,
  taskDossierPath,
} from './taskLinks'

describe('parseTaskDossierTab', () => {
  it('defaults to overview and accepts known tabs', () => {
    expect(parseTaskDossierTab(null)).toBe('overview')
    expect(parseTaskDossierTab('quotes')).toBe('quotes')
    expect(parseTaskDossierTab('admin')).toBe('admin')
    expect(parseTaskDossierTab('nope')).toBe('overview')
  })
})

describe('taskDossierPath', () => {
  it('omits the default tab so the URL stays short', () => {
    expect(taskDossierPath('t1')).toBe('/tasks/t1')
    expect(taskDossierPath('t1', 'overview')).toBe('/tasks/t1')
    expect(taskDossierPath('t1', 'admin')).toBe('/tasks/t1?tab=admin')
  })
})

describe('liveTaskHref', () => {
  it('opens the public Slashie task page by id', () => {
    expect(liveTaskHref('abc123')).toBe('https://slashie.app/tasks/abc123')
  })
})

describe('related inbox rows', () => {
  it('matches reports targeted at this task', () => {
    expect(isRelatedTaskReport({ targetType: 'TASK', targetId: 't1' }, 't1')).toBe(
      true,
    )
    expect(isRelatedTaskReport({ targetType: 'USER', targetId: 't1' }, 't1')).toBe(
      false,
    )
  })

  it('matches feedback that links the public task URL', () => {
    expect(
      isRelatedTaskFeedback(
        { pageUrl: 'https://slashie.app/tasks/t1' },
        't1',
      ),
    ).toBe(true)
    expect(
      isRelatedTaskFeedback({ message: 'broken tap on /tasks/t1' }, 't1'),
    ).toBe(true)
    expect(isRelatedTaskFeedback({ message: 'unrelated' }, 't1')).toBe(false)
  })

  it('deep-links into the inbox by item id', () => {
    expect(relatedReportLink({ id: 'r1', reason: 'SPAM', status: 'OPEN' })).toEqual(
      {
        id: 'r1',
        href: '/reports?id=r1',
        label: 'SPAM · OPEN',
        status: 'OPEN',
      },
    )
    expect(relatedFeedbackLink({ id: 'f1', category: 'BUG' }).href).toBe(
      '/feedback?id=f1',
    )
  })
})
