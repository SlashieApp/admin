import type { ReactNode } from 'react'

import type { SortDir } from '@/lib/listParams'

export type DataColumn<T> = {
  key: string
  header: string
  sortKey?: string
  className?: string
  render: (row: T) => ReactNode
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  sort,
  dir,
  onSort,
  loading,
  empty = 'No rows for this filter.',
  renderCard,
  footer,
  selectedKey,
  onRowClick,
}: {
  rows: T[]
  columns: DataColumn<T>[]
  rowKey: (row: T) => string
  sort?: string
  dir?: SortDir
  onSort?: (key: string) => void
  loading?: boolean
  empty?: string
  renderCard?: (row: T) => ReactNode
  footer?: ReactNode
  selectedKey?: string | null
  onRowClick?: (row: T) => void
}) {
  if (loading) {
    return (
      <div className="data-table-wrap" aria-busy="true">
        <p className="muted card-pad">Loading…</p>
        <div className="skeleton-card" aria-hidden />
      </div>
    )
  }

  if (rows.length === 0) {
    return <p className="muted empty-state">{empty}</p>
  }

  return (
    <div className="table-block">
      {renderCard ? (
        <div className="data-cards">
          {rows.map((row) => {
            const key = rowKey(row)
            const selected = selectedKey === key
            return (
              <article
                key={key}
                id={`task-card-${key}`}
                className={selected ? 'data-card is-selected' : 'data-card'}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {renderCard(row)}
              </article>
            )
          })}
        </div>
      ) : null}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => {
                const sortable = Boolean(column.sortKey && onSort)
                const active = sort === column.sortKey
                return (
                  <th key={column.key} className={column.className}>
                    {sortable ? (
                      <button
                        type="button"
                        className={active ? 'th-sort is-active' : 'th-sort'}
                        onClick={() => onSort?.(column.sortKey!)}
                      >
                        {column.header}
                        <span aria-hidden>
                          {active ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}
                        </span>
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const key = rowKey(row)
              const selected = selectedKey === key
              return (
                <tr
                  key={key}
                  id={`task-row-${key}`}
                  className={selected ? 'is-selected' : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={column.className}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  )
}
