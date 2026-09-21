import type { FormEvent, ReactNode } from 'react'

export function FilterToolbar({
  children,
  onSubmit,
  onClear,
  busy,
}: {
  children: ReactNode
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onClear?: () => void
  busy?: boolean
}) {
  return (
    <form className="filter-toolbar" onSubmit={onSubmit}>
      <div className="filter-grid">{children}</div>
      <div className="filter-actions">
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Loading…' : 'Apply filters'}
        </button>
        {onClear ? (
          <button className="btn" type="button" onClick={onClear} disabled={busy}>
            Clear
          </button>
        ) : null}
      </div>
    </form>
  )
}
