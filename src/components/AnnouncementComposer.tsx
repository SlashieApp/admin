'use client'

import { CombinedGraphQLErrors } from '@apollo/client/errors'
import { useId, useState } from 'react'

import { ConfirmAction } from '@/components/ConfirmAction'
import { AdminSendSystemFlash } from '@/graphql/operations'
import {
  ANNOUNCEMENT_BODY_MAX,
  ANNOUNCEMENT_COHORTS,
  ANNOUNCEMENT_DEFAULTS,
  ANNOUNCEMENT_TITLE_MAX,
  announcementErrorMessage,
  announcementKey,
  canSendAnnouncement,
  checkMatches,
  parseAnnouncement,
  peopleCount,
  recipientLine,
  sendHint,
  sendQuestion,
  toAnnouncementInput,
  type AnnouncementCohortKey,
  type AnnouncementDraft,
  type AnnouncementFormValues,
  type RecipientCheck,
} from '@/lib/announcement'
import { apolloClient } from '@/lib/apollo'
import { graphqlErrorMessage } from '@/lib/graphqlErrors'
import type { AdminSendSystemFlashMutation } from '@codegen/schema'

type Payload = AdminSendSystemFlashMutation['adminSendSystemFlash']

async function runAnnouncement(
  draft: AnnouncementDraft,
  dryRun: boolean,
): Promise<Payload> {
  const result = await apolloClient.mutate<AdminSendSystemFlashMutation>({
    mutation: AdminSendSystemFlash,
    variables: { input: toAnnouncementInput(draft, dryRun) },
  })
  const payload = result.data?.adminSendSystemFlash
  if (!payload) throw new Error('adminSendSystemFlash returned nothing')
  return payload
}

/**
 * Send an announcement (BE-69): it lands in each person's Slashie thread in
 * Messages, with a push. Two steps, so nothing goes out by accident: Check
 * recipients runs a dry run and shows the count, then Send asks before the
 * real send. Send is only offered while the form still matches that check.
 */
export function AnnouncementComposer() {
  const [values, setValues] = useState<AnnouncementFormValues>(
    ANNOUNCEMENT_DEFAULTS,
  )
  const [showErrors, setShowErrors] = useState(false)
  const [check, setCheck] = useState<RecipientCheck | null>(null)
  const [checking, setChecking] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)
  const hintId = useId()

  const parsed = parseAnnouncement(values)
  const draft = parsed.ok ? parsed.draft : null
  const errors = showErrors && !parsed.ok ? parsed.errors : {}
  const matching = checkMatches(check, draft) ? check : null
  const sendable = canSendAnnouncement(check, draft)
  const hint = sendHint(check, draft)
  const busy = checking || sending

  function change(next: Partial<AnnouncementFormValues>) {
    setValues((current) => ({ ...current, ...next }))
    setSent(null)
  }

  function toggleCohort(key: AnnouncementCohortKey, on: boolean) {
    const keys = new Set(values.cohortKeys)
    if (on) keys.add(key)
    else keys.delete(key)
    change({ cohortKeys: [...keys] })
  }

  async function onCheck() {
    setShowErrors(true)
    setSent(null)
    if (!draft) return
    setChecking(true)
    setError(null)
    try {
      const payload = await runAnnouncement(draft, true)
      // A check must never be a send. Stop if the API says it was not a dry run.
      if (!payload.dryRun) {
        throw new Error(
          'The check came back as a real send. Stop and tell engineering.',
        )
      }
      setCheck({
        key: announcementKey(draft),
        recipientCount: payload.recipientCount,
        auditId: payload.audit.id,
      })
    } catch (err) {
      setCheck(null)
      setError(announcementErrorMessage(graphqlErrorMessage(err)))
    } finally {
      setChecking(false)
    }
  }

  async function onSend() {
    if (!draft || !sendable) return
    setSending(true)
    setError(null)
    try {
      const payload = await runAnnouncement(draft, false)
      setSent(
        `Announcement sent to ${peopleCount(payload.recipientCount)}. Audit id ${payload.audit.id}`,
      )
      setValues(ANNOUNCEMENT_DEFAULTS)
      setShowErrors(false)
      setCheck(null)
    } catch (err) {
      const message = announcementErrorMessage(graphqlErrorMessage(err))
      if (CombinedGraphQLErrors.is(err)) {
        // The API answered with an error, so it sent nothing.
        setError(message)
      } else {
        // No answer (network or timeout): it may have gone out. Ask for a new
        // check so a second send is a deliberate choice.
        setCheck(null)
        setError(
          `The send could not be confirmed (${message}). It may or may not have gone out, so check before sending again.`,
        )
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="stack">
      <div className="page-intro">
        <h1>Send an announcement</h1>
        <p className="muted">
          It lands in each person&apos;s Slashie thread in Messages, with a
          push. Pick people, a cohort, or both, check the recipient count,
          then send. Nothing here reaches everyone.
        </p>
      </div>

      <div className="announcement-layout">
        <form
          className="stack form section"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            void onCheck()
          }}
        >
          <h2>Announcement</h2>

          <Field label="Title" error={errors.title}>
            {(props) => (
              <input
                {...props}
                className="input"
                value={values.title}
                maxLength={ANNOUNCEMENT_TITLE_MAX}
                disabled={sending}
                onChange={(event) => change({ title: event.target.value })}
              />
            )}
          </Field>

          <Field
            label="Message"
            hint={`${values.body.trim().length} of ${ANNOUNCEMENT_BODY_MAX}`}
            error={errors.body}
          >
            {(props) => (
              <textarea
                {...props}
                className="input textarea"
                rows={4}
                value={values.body}
                maxLength={ANNOUNCEMENT_BODY_MAX}
                disabled={sending}
                onChange={(event) => change({ body: event.target.value })}
              />
            )}
          </Field>

          <Field
            label="Image URL (optional)"
            hint="Shown on the announcement card in Messages. Must start with https://."
            error={errors.imageUrl}
          >
            {(props) => (
              <input
                {...props}
                className="input"
                inputMode="url"
                value={values.imageUrl}
                disabled={sending}
                onChange={(event) => change({ imageUrl: event.target.value })}
              />
            )}
          </Field>

          <Field
            label="User IDs"
            hint="One per line or comma-separated. Copy an ID from the user's page under Users."
            error={errors.userIdsText}
          >
            {(props) => (
              <textarea
                {...props}
                className="input textarea mono"
                rows={3}
                value={values.userIdsText}
                disabled={sending}
                onChange={(event) =>
                  change({ userIdsText: event.target.value })
                }
              />
            )}
          </Field>

          <fieldset className="fieldset">
            <legend>Cohorts</legend>
            {ANNOUNCEMENT_COHORTS.map((cohort) => (
              <label key={cohort.key} className="check">
                <input
                  type="checkbox"
                  checked={values.cohortKeys.includes(cohort.key)}
                  disabled={sending}
                  onChange={(event) =>
                    toggleCohort(cohort.key, event.target.checked)
                  }
                />
                {cohort.label}
              </label>
            ))}
          </fieldset>
          {errors.audience ? (
            <p className="field-error" role="alert">
              {errors.audience}
            </p>
          ) : null}

          {error ? (
            <p className="banner banner-error" role="alert">
              {error}
            </p>
          ) : null}
          {sent ? (
            <p className="banner banner-ok" role="status">
              {sent}
            </p>
          ) : null}
          {matching ? (
            <p
              className={
                matching.recipientCount > 0
                  ? 'banner banner-ok'
                  : 'banner banner-warn'
              }
              role="status"
            >
              {recipientLine(matching.recipientCount)}{' '}
              <span className="mono">Audit id {matching.auditId}</span>
            </p>
          ) : null}

          <div className="confirm-actions">
            <button
              type="submit"
              className={sendable ? 'btn' : 'btn btn-primary'}
              disabled={busy}
            >
              {checking ? 'Checking…' : 'Check recipients'}
            </button>
            {matching && sendable ? (
              <ConfirmAction
                // A new check is a new question: never reuse an open one.
                key={matching.key}
                label="Send"
                busyLabel="Sending…"
                confirmLabel={`Send to ${peopleCount(matching.recipientCount)}`}
                confirmText={sendQuestion(matching.recipientCount)}
                busy={busy}
                onConfirm={() => void onSend()}
              />
            ) : (
              <button
                type="button"
                className="btn is-unavailable"
                disabled
                aria-describedby={hint ? hintId : undefined}
              >
                Send
              </button>
            )}
          </div>
          {hint && !sent ? (
            <p id={hintId} className="meta">
              {hint}
            </p>
          ) : null}
        </form>

        <aside className="section" aria-label="Preview">
          <h2>Preview</h2>
          <p className="announcement-preview-title">
            {values.title.trim() || 'Title'}
          </p>
          <p className="muted announcement-preview-body">
            {values.body.trim() || 'Message'}
          </p>
        </aside>
      </div>
    </section>
  )
}

type ControlProps = {
  id: string
  'aria-describedby': string | undefined
  'aria-invalid': true | undefined
}

/**
 * A labelled control with its hint and error underneath. The hint and error
 * describe the control (`aria-describedby`) instead of sitting inside the
 * label, so its name stays just the label.
 */
function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: (props: ControlProps) => React.ReactNode
}) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') ||
    undefined
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })}
      {hint ? (
        <span id={hintId} className="meta field-hint">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="field-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}
