'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { ConfirmAction } from '@/components/ConfirmAction'
import { PostHogAnalytics } from '@/components/PostHogAnalytics'
import { WorkerUnlimited } from '@/components/WorkerUnlimited'
import {
  AdminSetUserDisabled,
  AdminUpdateUser,
  AdminUserDetail,
} from '@/graphql/operations'
import { apolloClient } from '@/lib/apollo'
import { displayName, formatWhen } from '@/lib/dossier'
import { graphqlErrorMessage } from '@/lib/graphqlErrors'
import { userDisabledConfirm, userDisabledResult } from '@/lib/suspension'
import {
  buildAdminUpdateUserInput,
  isWorkerUser,
  userToFormValues,
  type UserEditFormValues,
} from '@/lib/userInput'
import type {
  AdminSetUserDisabledMutation,
  AdminUpdateUserMutation,
  AdminUserDetailQuery,
} from '@codegen/schema'

type UserRow = AdminUserDetailQuery['adminUsers']['items'][number]

export function UserDetail({ userId }: { userId: string }) {
  const router = useRouter()
  const [user, setUser] = useState<UserRow | null>(null)
  const [values, setValues] = useState<UserEditFormValues | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveOk, setSaveOk] = useState<string | null>(null)
  // Bumped after a change the page can't patch in place (the worker's plan).
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      // A reload keeps the page on screen.
      if (reloadKey === 0) setLoading(true)
      setError(null)
      try {
        const result = await apolloClient.query<AdminUserDetailQuery>({
          query: AdminUserDetail,
          variables: { id: userId },
          fetchPolicy: 'network-only',
        })
        const next = result.data?.adminUsers.items[0]
        if (cancelled || !next) return
        setUser(next)
        setValues(userToFormValues(next))
      } catch (err) {
        if (!cancelled) setError(graphqlErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [userId, reloadKey])

  function patch<K extends keyof UserEditFormValues>(
    key: K,
    value: UserEditFormValues[K],
  ) {
    setValues((current) => (current ? { ...current, [key]: value } : current))
    setSaveOk(null)
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!values) return
    setSaving(true)
    setSaveError(null)
    setSaveOk(null)
    try {
      const result = await apolloClient.mutate<AdminUpdateUserMutation>({
        mutation: AdminUpdateUser,
        variables: {
          id: userId,
          input: buildAdminUpdateUserInput(values),
        },
      })
      const updated = result.data?.adminUpdateUser
      if (!updated) throw new Error('adminUpdateUser returned no user')
      // These mutations don't read the worker's plan; keep the loaded one.
      setUser((current) => current && { ...current, ...updated, worker: current.worker })
      setValues(userToFormValues(updated))
      setSaveOk('Saved with adminUpdateUser.')
    } catch (err) {
      setSaveError(graphqlErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function onToggleDisabled() {
    if (!user) return
    const nextDisabled = !user.disabled
    setToggling(true)
    setSaveError(null)
    setSaveOk(null)
    try {
      const result = await apolloClient.mutate<AdminSetUserDisabledMutation>({
        mutation: AdminSetUserDisabled,
        variables: { id: userId, disabled: nextDisabled },
      })
      const updated = result.data?.adminSetUserDisabled
      if (!updated) throw new Error('adminSetUserDisabled returned no user')
      // These mutations don't read the worker's plan; keep the loaded one.
      setUser((current) => current && { ...current, ...updated, worker: current.worker })
      setSaveOk(userDisabledResult(nextDisabled))
    } catch (err) {
      setSaveError(graphqlErrorMessage(err))
    } finally {
      setToggling(false)
    }
  }

  if (loading) return <p className="muted">Loading user…</p>
  if (error) return <p className="banner banner-error">{error}</p>
  if (!user || !values) return <p className="muted">User not found.</p>

  const worker = user.worker
  const posted = user.tasksPosted

  return (
    <section className="stack">
      <div className="page-head">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => router.push('/users')}
        >
          ← Users
        </button>
        <h1>{displayName(user)}</h1>
        <p className="mono muted">{userId}</p>
      </div>

      {isWorkerUser(user) ? (
        <p>
          <span className="pill pill-ok">Worker</span>
          <span className="muted"> This user has a linked worker profile.</span>
        </p>
      ) : (
        <p>
          <span className="pill">Not a worker</span>
          <span className="muted">
            {' '}
            This user is not a worker — no worker profile is linked.
          </span>
        </p>
      )}

      {saveError ? <p className="banner banner-error">{saveError}</p> : null}
      {saveOk ? <p className="banner banner-ok">{saveOk}</p> : null}
      {user.disabled ? (
        <p className="banner banner-error">This account is disabled.</p>
      ) : null}

      <div className="layout-split">
        <div className="stack">
          <article className="section">
            <h2>Profile</h2>
            <dl className="kv">
              <div>
                <dt>Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>Email verified</dt>
                <dd>{user.emailVerified ? 'yes' : 'no'}</dd>
              </div>
              <div>
                <dt>Phone verified</dt>
                <dd>
                  {user.phoneVerified == null
                    ? '—'
                    : user.phoneVerified
                      ? 'yes'
                      : 'no'}
                </dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatWhen(user.createdAt)}</dd>
              </div>
              <div>
                <dt>Contact</dt>
                <dd>{user.profile?.contactNumber || '—'}</dd>
              </div>
              <div>
                <dt>Disabled</dt>
                <dd>
                  {user.disabled == null ? 'unknown' : user.disabled ? 'yes' : 'no'}
                </dd>
              </div>
            </dl>
          </article>

          <article className="section">
            <h2>Worker</h2>
            {worker ? (
              <>
                <p className="meta mono">Worker id {worker.id}</p>
                <dl className="kv">
                  <div>
                    <dt>Legal name</dt>
                    <dd>{worker.legalName || '—'}</dd>
                  </div>
                  <div>
                    <dt>Category</dt>
                    <dd>{worker.primaryCategory || '—'}</dd>
                  </div>
                  <div>
                    <dt>Verified</dt>
                    <dd>{worker.isVerified ? 'yes' : 'no'}</dd>
                  </div>
                  <div>
                    <dt>Identity</dt>
                    <dd>{worker.identityVerification || '—'}</dd>
                  </div>
                  <div>
                    <dt>Experience</dt>
                    <dd>
                      {worker.yearsExperience != null
                        ? `${worker.yearsExperience} years`
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt>Area</dt>
                    <dd>{worker.serviceAreaLabel || '—'}</dd>
                  </div>
                  <div>
                    <dt>Rating</dt>
                    <dd>
                      {worker.ratingSummary
                        ? `${worker.ratingSummary.average ?? '—'} (${worker.ratingSummary.count})`
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt>Member since</dt>
                    <dd>{formatWhen(worker.memberSince)}</dd>
                  </div>
                </dl>
                {worker.tagline ? <p>{worker.tagline}</p> : null}
                {worker.bio ? <p className="muted">{worker.bio}</p> : null}
                {worker.skills?.length ? (
                  <p className="meta">Skills: {worker.skills.join(', ')}</p>
                ) : null}
                <WorkerUnlimited
                  userId={userId}
                  worker={worker}
                  onChanged={() => setReloadKey((key) => key + 1)}
                />
              </>
            ) : (
              <p className="muted">This user is not a worker.</p>
            )}
          </article>

          <article className="section">
            <h2>Tasks posted</h2>
            {posted.length === 0 ? (
              <p className="muted">No posted tasks on this record.</p>
            ) : (
              <ul className="list">
                {posted.map((task) => (
                  <li key={task.id} className="card">
                    <Link href={`/tasks/${task.id}`} className="card-link">
                      <div className="card-top">
                        <strong>{task.title}</strong>
                        <span className="pill">{task.status}</span>
                      </div>
                      <p className="meta">{task.categories.join(', ')}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>

        <form className="stack form section" onSubmit={(e) => void onSubmit(e)}>
          <h2>Ops actions</h2>
          <label className="field">
            Name
            <input
              className="input"
              value={values.name}
              onChange={(e) => patch('name', e.target.value)}
            />
          </label>
          <label className="field">
            Contact number
            <input
              className="input"
              value={values.contactNumber}
              onChange={(e) => patch('contactNumber', e.target.value)}
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={values.emailVerified}
              onChange={(e) => patch('emailVerified', e.target.checked)}
            />
            Email verified
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={values.phoneVerified}
              onChange={(e) => patch('phoneVerified', e.target.checked)}
            />
            Phone verified
          </label>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save user'}
          </button>
          <ConfirmAction
            danger
            label={user.disabled ? 'Re-enable user' : 'Disable user'}
            confirmText={userDisabledConfirm(!user.disabled)}
            busy={toggling}
            onConfirm={() => void onToggleDisabled()}
          />
        </form>
      </div>

      <PostHogAnalytics kind="user" userId={userId} email={user.email} />
    </section>
  )
}
