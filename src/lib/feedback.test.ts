import { describe, expect, it } from 'vitest'

import {
  adjustFeedbackSummary,
  categoryLabel,
  createdAtMs,
  feedbackFromApi,
  feedbackMailto,
  feedbackPath,
  feedbackPreview,
  mergeFeedbackRow,
  parseFeedbackCategoryFilter,
  parseFeedbackId,
  parseFeedbackStatusFilter,
  ratingLabel,
  sortFeedbacksOpenFirst,
  submitterHref,
  submitterLabel,
  toAdminFeedbacksVariables,
  type FeedbackRow,
} from './feedback'

function feedback(
  partial: Partial<FeedbackRow> & Pick<FeedbackRow, 'id'>,
): FeedbackRow {
  return {
    email: 'pat@example.com',
    category: 'GENERAL',
    message: 'The quote form is confusing.',
    status: 'OPEN',
    createdAt: '2026-09-18T12:00:00.000Z',
    ...partial,
  }
}

describe('parseFeedbackStatusFilter', () => {
  it('defaults to all statuses', () => {
    expect(parseFeedbackStatusFilter(null)).toBe('ALL')
    expect(parseFeedbackStatusFilter('nope')).toBe('ALL')
    expect(parseFeedbackStatusFilter('ACTIONED')).toBe('ALL')
  })

  it('accepts known feedback statuses', () => {
    expect(parseFeedbackStatusFilter('OPEN')).toBe('OPEN')
    expect(parseFeedbackStatusFilter('REVIEWED')).toBe('REVIEWED')
    expect(parseFeedbackStatusFilter('REPLIED')).toBe('REPLIED')
    expect(parseFeedbackStatusFilter('DISMISSED')).toBe('DISMISSED')
  })
})

describe('parseFeedbackCategoryFilter', () => {
  it('defaults to all categories', () => {
    expect(parseFeedbackCategoryFilter(null)).toBe('ALL')
    expect(parseFeedbackCategoryFilter('SPAM')).toBe('ALL')
  })

  it('accepts known categories', () => {
    expect(parseFeedbackCategoryFilter('BUG')).toBe('BUG')
    expect(parseFeedbackCategoryFilter('RATING')).toBe('RATING')
    expect(parseFeedbackCategoryFilter('FEATURE_REQUEST')).toBe(
      'FEATURE_REQUEST',
    )
    expect(parseFeedbackCategoryFilter('GENERAL')).toBe('GENERAL')
  })
})

describe('parseFeedbackId', () => {
  it('keeps a non-empty selected id', () => {
    expect(parseFeedbackId('abc')).toBe('abc')
    expect(parseFeedbackId('  ')).toBeNull()
    expect(parseFeedbackId(null)).toBeNull()
  })
})

describe('toAdminFeedbacksVariables', () => {
  it('omits status and category on the default inbox', () => {
    expect(
      toAdminFeedbacksVariables({ status: 'ALL', category: 'ALL' }),
    ).toEqual({ first: 100 })
  })

  it('passes status, category, and after when paging a filtered view', () => {
    expect(
      toAdminFeedbacksVariables({
        status: 'OPEN',
        category: 'BUG',
        after: 'cursor-1',
        first: 50,
      }),
    ).toEqual({
      first: 50,
      status: 'OPEN',
      category: 'BUG',
      after: 'cursor-1',
    })
  })
})

describe('sortFeedbacksOpenFirst', () => {
  it('keeps OPEN items first then newest within a status', () => {
    const rows = sortFeedbacksOpenFirst([
      feedback({
        id: 'old-open',
        status: 'OPEN',
        createdAt: '2026-09-01T00:00:00.000Z',
      }),
      feedback({
        id: 'new-reviewed',
        status: 'REVIEWED',
        createdAt: '2026-09-14T00:00:00.000Z',
      }),
      feedback({
        id: 'new-open',
        status: 'OPEN',
        createdAt: '2026-09-13T00:00:00.000Z',
      }),
      feedback({
        id: 'replied',
        status: 'REPLIED',
        createdAt: '2026-09-12T00:00:00.000Z',
      }),
    ])
    expect(rows.map((row) => row.id)).toEqual([
      'new-open',
      'old-open',
      'new-reviewed',
      'replied',
    ])
  })
})

describe('labels and links', () => {
  it('uses human category labels, not report reasons', () => {
    expect(categoryLabel('BUG')).toBe('Bug')
    expect(categoryLabel('FEATURE_REQUEST')).toBe('Feature request')
    expect(categoryLabel('RATING')).toBe('Rating')
    expect(categoryLabel('GENERAL')).toBe('General')
  })

  it('prefers name then email then user id for the submitter', () => {
    expect(
      submitterLabel(
        feedback({
          id: '1',
          name: 'Pat',
          email: 'pat@x.com',
          userId: 'u2',
        }),
      ),
    ).toBe('Pat')
    expect(submitterLabel(feedback({ id: '2', email: 'sam@x.com' }))).toBe(
      'sam@x.com',
    )
    expect(
      submitterLabel(
        feedback({ id: '3', email: '', userId: 'u4', name: null }),
      ),
    ).toBe('u4')
  })

  it('links signed-in submitters to the users dossier', () => {
    expect(submitterHref(feedback({ id: '1', userId: 'u9' }))).toBe(
      '/users/u9',
    )
    expect(submitterHref(feedback({ id: '2' }))).toBeNull()
  })

  it('renders optional 1–5 ratings and a message preview', () => {
    expect(ratingLabel(4)).toBe('4/5')
    expect(ratingLabel(null)).toBe('—')
    expect(ratingLabel(0)).toBe('—')
    expect(feedbackPreview('Short note')).toBe('Short note')
    expect(feedbackPreview('x'.repeat(160)).length).toBeLessThanOrEqual(121)
    expect(feedbackPreview('x'.repeat(160)).endsWith('…')).toBe(true)
  })
})

describe('feedbackFromApi', () => {
  it('maps BE-48 fields including pageUrl alias path', () => {
    const row = feedbackFromApi({
      id: 'f1',
      email: 'lee@x.com',
      name: 'Lee',
      category: 'BUG',
      rating: 2,
      message: 'Map pins overlap.',
      pageUrl: null,
      path: '/task/leaky-tap',
      status: 'OPEN',
      createdAt: '2026-09-18T12:00:00.000Z',
      userId: 'u1',
    })
    expect(row.pageUrl).toBe('/task/leaky-tap')
    expect(row.email).toBe('lee@x.com')
    expect(row.category).toBe('BUG')
    expect(row.rating).toBe(2)
  })
})

describe('mergeFeedbackRow', () => {
  it('keeps message and submitter after a core status update', () => {
    const current = feedback({
      id: 'f1',
      name: 'Sam',
      email: 'sam@x.com',
      message: 'Please add dark mode.',
      pageUrl: 'https://slashie.app/dashboard',
    })
    const merged = mergeFeedbackRow(
      current,
      feedback({ id: 'f1', status: 'REVIEWED', message: '' }),
    )
    expect(merged.status).toBe('REVIEWED')
    expect(merged.message).toBe('Please add dark mode.')
    expect(merged.name).toBe('Sam')
    expect(merged.pageUrl).toBe('https://slashie.app/dashboard')
  })
})

describe('feedbackPath', () => {
  it('omits default all-status / all-category query params', () => {
    expect(feedbackPath({})).toBe('/feedback')
    expect(feedbackPath({ status: 'ALL', category: 'ALL' })).toBe('/feedback')
    expect(
      feedbackPath({ status: 'OPEN', category: 'BUG', id: 'f9' }),
    ).toBe('/feedback?status=OPEN&category=BUG&id=f9')
  })
})

describe('feedbackMailto', () => {
  it('builds a mailto that quotes the draft subject and body', () => {
    const href = feedbackMailto({
      to: 'pat@example.com',
      subject: 'Re: your Slashie feedback',
      body: 'Thanks for writing in.\n\n> The quote form is confusing.',
    })
    expect(href.startsWith('mailto:pat@example.com?')).toBe(true)
    expect(href).toContain('subject=Re%3A%20your%20Slashie%20feedback')
    expect(href).toContain('The%20quote%20form%20is%20confusing.')
    expect(href).not.toContain('+')
  })
})

describe('createdAtMs', () => {
  it('parses ISO timestamps and treats junk as 0', () => {
    expect(createdAtMs('2026-09-18T12:00:00.000Z')).toBe(
      Date.parse('2026-09-18T12:00:00.000Z'),
    )
    expect(createdAtMs('nope')).toBe(0)
    expect(createdAtMs(null)).toBe(0)
  })
})

describe('adjustFeedbackSummary', () => {
  it('moves a count from open to replied without changing total', () => {
    const next = adjustFeedbackSummary(
      { total: 10, open: 4, reviewed: 3, replied: 2 },
      'OPEN',
      'REPLIED',
    )
    expect(next).toEqual({ total: 10, open: 3, reviewed: 3, replied: 3 })
  })

  it('leaves counts alone when status did not change', () => {
    const current = { total: 4, open: 1, reviewed: 1, replied: 1 }
    expect(adjustFeedbackSummary(current, 'OPEN', 'OPEN')).toBe(current)
    expect(adjustFeedbackSummary(null, 'OPEN', 'REVIEWED')).toBeNull()
  })
})
