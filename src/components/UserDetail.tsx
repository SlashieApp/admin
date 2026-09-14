'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { PostHogAnalytics } from '@/components/PostHogAnalytics'
import {
  AdminSetUserDisabled,
  AdminUpdateUser,
  AdminUserDetail,
  AdminUserDetailCore,
} from '@/graphql/operations'
import { apolloClient } from '@/lib/apollo'
import { displayName, formatWhen } from '@/lib/dossier'
import {
  graphqlErrorMessage,
  isMissingAdminFieldError,
} from '@/lib/graphqlErrors'
import {
  buildAdminUpdateUserInput,
  isWorkerUser,
  userToFormValues,
  type UserEditFormValues,
} from '@/lib/userInput'
import type {
  AdminSetUserDisabledMutation,
  AdminUpdateUserMutation,
  AdminUserDetailCoreQuery,
  AdminUserDetailQuery,
} from '@codegen/schema'

type UserRow = AdminUserDetailQuery['adminUsers'][number]

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
  const [banner, setBanner] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      setBanner(null)
      try {
        const next = await loadUser(userId)
        if (cancelled) return
        setUser(next.user)
        setValues(userToFormValues(next.user))
        setBanner(next.banner)
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
  }, [userId])

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
      setUser((current) => ({ ...(current ?? updated), ...updated }))
      setValues(userToFormValues(updated))
      setSaveOk('Saved with adminUpdateUser.')
    } catch (err) {
      if (isMissingAdminFieldError(err)) {
        setSaveError(
          'adminUpdateUser is not on this Apollo yet (BE-43). Point NEXT_PUBLIC_GRAPHQL_URL at an API that has the @admin mutation.',
        )
      } else {
        setSaveError(graphqlErrorMessage(err))
      }
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
      setUser((current) => ({
        ...(current ?? updated),
        ...updated,
        disabled: updated.disabled ?? nextDisabled,
      }))
      setSaveOk(nextDisabled ? 'User disabled.' : 'User re-enabled.')
    } catch (err) {
      if (isMissingAdminFieldError(err)) {
        setSaveError(
          'adminSetUserDisabled is not on this Apollo yet (BE-43).',
        )
      } else {
        setSaveError(graphqlErrorMessage(err))
      }
    } finally {
      setToggling(false)
    }
  }

  if (loading) return <p className="muted">Loading user…</p>
  if (error) return <p className="banner banner-error">{error}</p>
  if (!user || !values) return <p className="muted">User not found.</p>

  const worker = user.worker
  const posted = user.tasksPosted ?? []

  return (
    <section className="stack">
      <div className="page-head">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => router.push('/?mode=users')}
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

      {banner ? <p className="banner banner-warn">{banner}</p> : null}
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
            {user.profile?.bio ? <p>{user.profile.bio}</p> : null}
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
                      <p className="meta">{task.category}</p>
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
          <button
            className="btn btn-danger"
            type="button"
            disabled={toggling}
            onClick={() => void onToggleDisabled()}
          >
            {toggling
              ? 'Updating…'
              : user.disabled
                ? 'Re-enable user'
                : 'Disable user'}
          </button>
        </form>
      </div>

      <PostHogAnalytics kind="user" userId={userId} email={user.email} />
    </section>
  )
}

async function loadUser(id: string): Promise<{
  user: UserRow
  banner: string | null
}> {
  try {
    const result = await apolloClient.query<AdminUserDetailQuery>({
      query: AdminUserDetail,
      variables: { id, first: 1 },
      fetchPolicy: 'network-only',
    })
    const user = result.data?.adminUsers?.[0]
    if (user) return { user, banner: null }
  } catch (error) {
    if (!isMissingAdminFieldError(error)) throw error
  }

  try {
    const result = await apolloClient.query<AdminUserDetailCoreQuery>({
      query: AdminUserDetailCore,
      variables: { id, first: 1 },
      fetchPolicy: 'network-only',
    })
    const user = result.data?.adminUsers?.[0]
    if (user) {
      return {
        user,
        banner:
          'Some BE-43 user fields (disabled / tasksPosted) are missing. Showing the core adminUsers record.',
      }
    }
  } catch (error) {
    if (!isMissingAdminFieldError(error)) throw error
    throw new Error(
      'adminUsers is not on this Apollo yet (BE-43). User search and management need that API.',
    )
  }

  throw new Error('User not found')
}
