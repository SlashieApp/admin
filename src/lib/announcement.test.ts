import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  ANNOUNCEMENT_BODY_MAX,
  ANNOUNCEMENT_COHORTS,
  ANNOUNCEMENT_DEFAULTS,
  ANNOUNCEMENT_TITLE_MAX,
  ANNOUNCEMENT_USER_IDS_MAX,
  announcementErrorMessage,
  announcementKey,
  canSendAnnouncement,
  checkMatches,
  parseAnnouncement,
  parseUserIds,
  recipientLine,
  sendHint,
  sendQuestion,
  toAnnouncementInput,
  type AnnouncementDraft,
  type AnnouncementFormValues,
} from './announcement'

function values(over: Partial<AnnouncementFormValues> = {}): AnnouncementFormValues {
  return {
    ...ANNOUNCEMENT_DEFAULTS,
    title: 'Hello',
    body: 'A short note.',
    userIdsText: 'u1',
    ...over,
  }
}

function draftOf(over: Partial<AnnouncementFormValues> = {}): AnnouncementDraft {
  const parsed = parseAnnouncement(values(over))
  if (!parsed.ok) throw new Error('expected a valid draft')
  return parsed.draft
}

describe('cohorts', () => {
  // A cohort added to the API must be added to the page too, by name.
  it('lists every AdminCohortKey in schema/admin.graphql', () => {
    const sdl = readFileSync(
      new URL('../../schema/admin.graphql', import.meta.url),
      'utf8',
    )
    const block = /enum AdminCohortKey \{([^}]*)\}/.exec(sdl)?.[1] ?? ''
    const keys = block.split(/\s+/).filter(Boolean)
    expect(keys.length).toBeGreaterThan(0)
    expect(ANNOUNCEMENT_COHORTS.map((cohort) => cohort.key).sort()).toEqual(
      [...keys].sort(),
    )
  })
})

describe('parseUserIds', () => {
  it('splits on lines, commas and spaces, dropping blanks and repeats', () => {
    expect(parseUserIds(' u1,u2\n\nu3  u1 ,, u2\r\nu4')).toEqual([
      'u1',
      'u2',
      'u3',
      'u4',
    ])
  })

  it('is empty for blank text', () => {
    expect(parseUserIds('  \n ,')).toEqual([])
  })
})

describe('parseAnnouncement', () => {
  it('trims the copy and keeps the audience', () => {
    expect(
      parseAnnouncement(
        values({
          title: '  Hello ',
          body: ' A short note. ',
          imageUrl: ' https://example.com/a.png ',
          userIdsText: 'u1, u2',
          cohortKeys: ['founding_workers'],
        }),
      ),
    ).toEqual({
      ok: true,
      draft: {
        title: 'Hello',
        body: 'A short note.',
        imageUrl: 'https://example.com/a.png',
        userIds: ['u1', 'u2'],
        cohortKeys: ['founding_workers'],
      },
    })
  })

  it('accepts a cohort with no user ids, and user ids with no cohort', () => {
    expect(
      parseAnnouncement(values({ userIdsText: '', cohortKeys: ['geo_watford_bushey'] })).ok,
    ).toBe(true)
    expect(parseAnnouncement(values({ userIdsText: 'u1', cohortKeys: [] })).ok).toBe(true)
  })

  it('rejects an empty audience: there is no send-to-everyone', () => {
    const parsed = parseAnnouncement(values({ userIdsText: ' \n', cohortKeys: [] }))
    expect(parsed).toEqual({
      ok: false,
      errors: {
        audience: 'Choose at least one person or cohort. There is no send-to-everyone.',
      },
    })
  })

  it('needs a title and a message', () => {
    const parsed = parseAnnouncement(values({ title: '  ', body: '' }))
    expect(parsed).toEqual({
      ok: false,
      errors: { title: 'Enter a title.', body: 'Enter a message.' },
    })
  })

  it('holds the title and message to their limits', () => {
    expect(
      parseAnnouncement(
        values({
          title: 'a'.repeat(ANNOUNCEMENT_TITLE_MAX),
          body: 'b'.repeat(ANNOUNCEMENT_BODY_MAX),
        }),
      ).ok,
    ).toBe(true)
    const parsed = parseAnnouncement(
      values({
        title: 'a'.repeat(ANNOUNCEMENT_TITLE_MAX + 1),
        body: 'b'.repeat(ANNOUNCEMENT_BODY_MAX + 1),
      }),
    )
    expect(parsed.ok).toBe(false)
    if (!parsed.ok) {
      expect(Object.keys(parsed.errors).sort()).toEqual(['body', 'title'])
    }
  })

  it('only takes an https image address, as the API does', () => {
    for (const imageUrl of ['http://example.com/a.png', 'example.com/a.png', 'javascript:alert(1)']) {
      const parsed = parseAnnouncement(values({ imageUrl }))
      expect(parsed.ok).toBe(false)
      if (!parsed.ok) expect(Object.keys(parsed.errors)).toEqual(['imageUrl'])
    }
    expect(parseAnnouncement(values({ imageUrl: '' })).ok).toBe(true)
  })

  it('caps typed user ids at the API limit', () => {
    const ids = (count: number) =>
      Array.from({ length: count }, (_, index) => `u${index}`).join('\n')
    expect(parseAnnouncement(values({ userIdsText: ids(ANNOUNCEMENT_USER_IDS_MAX) })).ok).toBe(true)
    const parsed = parseAnnouncement(
      values({ userIdsText: ids(ANNOUNCEMENT_USER_IDS_MAX + 1) }),
    )
    expect(parsed.ok).toBe(false)
    if (!parsed.ok) expect(Object.keys(parsed.errors)).toEqual(['userIdsText'])
  })
})

describe('announcementKey', () => {
  it('ignores the order of ids and cohorts', () => {
    const a = draftOf({
      userIdsText: 'u1 u2',
      cohortKeys: ['founding_workers', 'geo_watford_bushey'],
    })
    const b = draftOf({
      userIdsText: 'u2 u1',
      cohortKeys: ['geo_watford_bushey', 'founding_workers'],
    })
    expect(announcementKey(a)).toBe(announcementKey(b))
  })

  it('changes when the copy, image or audience changes', () => {
    const base = announcementKey(draftOf())
    expect(announcementKey(draftOf({ title: 'Hello!' }))).not.toBe(base)
    expect(announcementKey(draftOf({ body: 'Another note.' }))).not.toBe(base)
    expect(announcementKey(draftOf({ imageUrl: 'https://example.com/a.png' }))).not.toBe(base)
    expect(announcementKey(draftOf({ userIdsText: 'u1 u2' }))).not.toBe(base)
    expect(announcementKey(draftOf({ cohortKeys: ['founding_workers'] }))).not.toBe(base)
  })
})

describe('toAnnouncementInput', () => {
  it('carries the dry-run flag and sends no image as null', () => {
    const draft = draftOf()
    expect(toAnnouncementInput(draft, true)).toEqual({
      title: 'Hello',
      body: 'A short note.',
      imageUrl: null,
      userIds: ['u1'],
      cohortKeys: [],
      dryRun: true,
    })
    expect(toAnnouncementInput(draft, false).dryRun).toBe(false)
    expect(
      toAnnouncementInput(draftOf({ imageUrl: 'https://example.com/a.png' }), true).imageUrl,
    ).toBe('https://example.com/a.png')
  })
})

describe('the recipient check gates Send', () => {
  const draft = draftOf()
  const check = (recipientCount: number, of: AnnouncementDraft = draft) => ({
    key: announcementKey(of),
    recipientCount,
    auditId: 'audit-1',
  })

  it('cannot send before a check', () => {
    expect(canSendAnnouncement(null, draft)).toBe(false)
    expect(sendHint(null, draft)).toBe('Check recipients before sending.')
  })

  it('can send once the check matches and found someone', () => {
    expect(checkMatches(check(3), draft)).toBe(true)
    expect(canSendAnnouncement(check(3), draft)).toBe(true)
    expect(sendHint(check(3), draft)).toBeNull()
  })

  it('cannot send when the check found no one', () => {
    expect(canSendAnnouncement(check(0), draft)).toBe(false)
    expect(sendHint(check(0), draft)).toBe('There is no one to send this to.')
  })

  it('cannot send after anything changes, or while the form is invalid', () => {
    const edited = draftOf({ title: 'Hello again' })
    expect(canSendAnnouncement(check(3), edited)).toBe(false)
    expect(sendHint(check(3), edited)).toBe(
      'The announcement changed since the last check. Check recipients again.',
    )
    expect(canSendAnnouncement(check(3), null)).toBe(false)
  })
})

describe('copy', () => {
  it('counts people', () => {
    expect(recipientLine(0)).toBe('No one matches that audience.')
    expect(recipientLine(1)).toBe('1 person will receive this.')
    expect(recipientLine(12)).toBe('12 people will receive this.')
    expect(recipientLine(1000)).toBe('1,000 people will receive this.')
  })

  it('asks before sending, with the count', () => {
    expect(sendQuestion(1)).toMatch(/^Send to 1 person\?/)
    expect(sendQuestion(42)).toMatch(/^Send to 42 people\?/)
  })

  it('puts the API error codes in plain words and passes others through', () => {
    expect(announcementErrorMessage('USER_NOT_FOUND')).toBe(
      'One or more of those user IDs does not match an account.',
    )
    expect(announcementErrorMessage('FLASH_RECIPIENT_CAP')).toMatch(/1,000 people/)
    expect(announcementErrorMessage('Network error')).toBe('Network error')
  })
})
