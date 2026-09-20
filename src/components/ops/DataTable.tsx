import type { ReactNode } from 'react'

import { toggleSort, type SortDir } from '@/lib/listQuery'

export type DataColumn = {
  key: string
  label: string
  sortKey?: string
}

type Props<T extends { id: string }> = {
  caption: string
  columns: DataColumn[]
  rows: T[]
  render: (row: T, key: string) => ReactNode
  sort: string
  dir: SortDir
  onSort?: (sort: string, dir: SortDir) => void
  selectedId?: string | null
  empty: string
}

export function DataTable<T extends { id: string }>({
  caption,
  columns,
  rows,
  render,
  sort,
  dir,
  onSort,
  selectedId,
  empty,
}: Props<T>) {
  if (rows.length === 0) {
    return <p className="muted">{empty}</p>
  }

  return (
    <div className="data-table-wrap">
      <table className="data-table is-compact">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => {
              const active = column.sortKey && sort === column.sortKey
              return (
                <th key={column.key} scope="col">
                  {column.sortKey && onSort ? (
                    <button
                      type="button"
                      className={active ? 'th-sort is-active' : 'th-sort'}
                      onClick={() => {
                        const next = toggleSort(sort, dir, column.sortKey!)
                        onSort(next.sort, next.dir)
                      }}
                    >
                      {column.label}
                      {active ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={selectedId === row.id ? 'is-selected' : undefined}
            >
              {columns.map((column) => (
                <td key={column.key} data-label={column.label}>
                  {render(row, column.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
