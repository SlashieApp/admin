import { useState, type FormEvent, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onClearHref?: string
  busy?: boolean
  note?: string | null
}

export function FilterToolbar({
  children,
  onSubmit,
  onClearHref,
  busy,
  note,
}: Props) {
  return (
    <form className="filter-toolbar" onSubmit={onSubmit}>
      <div className="filter-grid">{children}</div>
      <div className="filter-actions">
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Loading…' : 'Apply filters'}
        </button>
        {onClearHref ? (
          <a className="btn btn-ghost" href={onClearHref}>
            Clear
          </a>
        ) : null}
      </div>
      {note ? <p className="filter-note">{note}</p> : null}
    </form>
  )
}

export function FilterField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="field">
      {label}
      {children}
    </label>
  )
}

/** Owns a draft copy of URL filters. Remount with `key` when the URL changes. */
export function DraftFilters<T>({
  value,
  children,
}: {
  value: T
  children: (draft: T, setDraft: (next: T) => void) => ReactNode
}) {
  const [draft, setDraft] = useState(value)
  return <>{children(draft, setDraft)}</>
}
