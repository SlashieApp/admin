/**
 * Announcements (BE-69): a Slashie message with a push, sent to chosen people
 * and/or cohorts through `adminSendSystemFlash`. There is no send-to-everyone:
 * an empty audience is rejected here and by the API.
 *
 * Sending is two steps. A dry run returns how many people match, then the
 * real send is offered only while what is typed still matches that check.
 */

export const ANNOUNCEMENT_TITLE_MAX = 120
export const ANNOUNCEMENT_BODY_MAX = 500
/** API cap on typed user ids (`ADMIN_FLASH_MAX_USER_IDS`). */
export const ANNOUNCEMENT_USER_IDS_MAX = 200

export type AnnouncementCohortKey = 'founding_workers' | 'geo_watford_bushey'

export const ANNOUNCEMENT_COHORTS: {
  key: AnnouncementCohortKey
  label: string
}[] = [
  { key: 'founding_workers', label: 'Founding workers' },
  { key: 'geo_watford_bushey', label: 'Watford and Bushey' },
]

export type AnnouncementFormValues = {
  title: string
  body: string
  imageUrl: string
  userIdsText: string
  cohortKeys: AnnouncementCohortKey[]
}

export const ANNOUNCEMENT_DEFAULTS: AnnouncementFormValues = {
  title: '',
  body: '',
  imageUrl: '',
  userIdsText: '',
  cohortKeys: [],
}

export type AnnouncementDraft = {
  title: string
  body: string
  imageUrl: string
  userIds: string[]
  cohortKeys: AnnouncementCohortKey[]
}

export type AnnouncementField =
  | 'title'
  | 'body'
  | 'imageUrl'
  | 'userIdsText'
  | 'audience'

export type AnnouncementParseResult =
  | { ok: true; draft: AnnouncementDraft }
  | { ok: false; errors: Partial<Record<AnnouncementField, string>> }

/** The API only accepts https images (`INVALID_FLASH_URL` otherwise). */
function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

/** One id per line or comma-separated. Blanks and repeats are dropped. */
export function parseUserIds(text: string): string[] {
  const seen = new Set<string>()
  const ids: string[] = []
  for (const part of text.split(/[\s,]+/)) {
    const id = part.trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
  }
  return ids
}

export function parseAnnouncement(
  values: AnnouncementFormValues,
): AnnouncementParseResult {
  const title = values.title.trim()
  const body = values.body.trim()
  const imageUrl = values.imageUrl.trim()
  const userIds = parseUserIds(values.userIdsText)
  const cohortKeys = [...values.cohortKeys]
  const errors: Partial<Record<AnnouncementField, string>> = {}

  if (!title) errors.title = 'Enter a title.'
  else if (title.length > ANNOUNCEMENT_TITLE_MAX) {
    errors.title = `Keep the title to ${ANNOUNCEMENT_TITLE_MAX} characters or fewer.`
  }
  if (!body) errors.body = 'Enter a message.'
  else if (body.length > ANNOUNCEMENT_BODY_MAX) {
    errors.body = `Keep the message to ${ANNOUNCEMENT_BODY_MAX} characters or fewer.`
  }
  if (imageUrl && !isHttpsUrl(imageUrl)) {
    errors.imageUrl = 'Enter an image address that starts with https://.'
  }
  if (userIds.length > ANNOUNCEMENT_USER_IDS_MAX) {
    errors.userIdsText = `Enter ${ANNOUNCEMENT_USER_IDS_MAX} user IDs or fewer.`
  }
  if (userIds.length === 0 && cohortKeys.length === 0) {
    errors.audience =
      'Choose at least one person or cohort. There is no send-to-everyone.'
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return { ok: true, draft: { title, body, imageUrl, userIds, cohortKeys } }
}

/**
 * Identifies what a recipient check was run for. The order of ids and cohorts
 * does not matter; any other change means the check must be run again.
 */
export function announcementKey(draft: AnnouncementDraft): string {
  return JSON.stringify({
    title: draft.title,
    body: draft.body,
    imageUrl: draft.imageUrl,
    userIds: [...draft.userIds].sort(),
    cohortKeys: [...draft.cohortKeys].sort(),
  })
}

export type AnnouncementInput = {
  title: string
  body: string
  imageUrl: string | null
  userIds: string[]
  cohortKeys: AnnouncementCohortKey[]
  dryRun: boolean
}

/** Variables for `adminSendSystemFlash`. `dryRun: true` sends nothing. */
export function toAnnouncementInput(
  draft: AnnouncementDraft,
  dryRun: boolean,
): AnnouncementInput {
  return {
    title: draft.title,
    body: draft.body,
    imageUrl: draft.imageUrl || null,
    userIds: draft.userIds,
    cohortKeys: draft.cohortKeys,
    dryRun,
  }
}

export type RecipientCheck = {
  /** `announcementKey` of the draft that was checked. */
  key: string
  recipientCount: number
  auditId: string
}

/** The check still describes what is typed, so its count can be trusted. */
export function checkMatches(
  check: RecipientCheck | null,
  draft: AnnouncementDraft | null,
): check is RecipientCheck {
  return Boolean(check && draft && check.key === announcementKey(draft))
}

/** Send is offered only after a matching check that found someone. */
export function canSendAnnouncement(
  check: RecipientCheck | null,
  draft: AnnouncementDraft | null,
): boolean {
  return checkMatches(check, draft) && check.recipientCount > 0
}

export function peopleCount(count: number): string {
  return count === 1 ? '1 person' : `${count.toLocaleString('en-GB')} people`
}

export function recipientLine(count: number): string {
  if (count <= 0) return 'No one matches that audience.'
  return `${peopleCount(count)} will receive this.`
}

/** The question asked before the real send. */
export function sendQuestion(count: number): string {
  return `Send to ${peopleCount(count)}? It goes out straight away with a push and cannot be taken back.`
}

/** Why Send is not offered yet, or null when it is. */
export function sendHint(
  check: RecipientCheck | null,
  draft: AnnouncementDraft | null,
): string | null {
  if (!check) return 'Check recipients before sending.'
  if (!checkMatches(check, draft)) {
    return 'The announcement changed since the last check. Check recipients again.'
  }
  if (check.recipientCount <= 0) return 'There is no one to send this to.'
  return null
}

const API_ERRORS: Record<string, string> = {
  FLASH_TITLE_REQUIRED: 'The API did not accept that title.',
  FLASH_BODY_REQUIRED: 'The API did not accept that message.',
  INVALID_FLASH_URL: 'The API did not accept that image address. It must start with https://.',
  FLASH_TARGET_REQUIRED:
    'Choose at least one person or cohort. There is no send-to-everyone.',
  FLASH_USER_IDS_CAP: `Enter ${ANNOUNCEMENT_USER_IDS_MAX} user IDs or fewer.`,
  FLASH_RECIPIENT_CAP:
    'That audience is over the limit of 1,000 people for one announcement.',
  USER_NOT_FOUND: 'One or more of those user IDs does not match an account.',
  UNKNOWN_COHORT_KEY: 'The API does not know one of those cohorts.',
  ADMIN_FLASH_RATE_LIMITED:
    'Too many checks or sends in the last hour. Try again later.',
}

/** Plain words for the API's announcement error codes; other messages pass through. */
export function announcementErrorMessage(message: string): string {
  return API_ERRORS[message.trim()] ?? message
}
