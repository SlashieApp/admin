import { TABLE_PAGE_SIZES } from '@/lib/listParams'

export function TablePager({
  shown,
  fetched,
  pageSize,
  hasNext,
  hasPrev,
  onNext,
  onPrev,
  onFirst,
  onPageSize,
  note,
}: {
  shown: number
  fetched: number
  pageSize: number
  hasNext?: boolean
  hasPrev?: boolean
  onNext?: () => void
  onPrev?: () => void
  onFirst?: () => void
  onPageSize?: (size: number) => void
  note?: string | null
}) {
  return (
    <div className="table-pager">
      <p className="meta table-pager-count">
        Showing {shown}
        {fetched !== shown ? ` of ${fetched} on this page` : ''}
        {note ? ` · ${note}` : ''}
      </p>
      <div className="table-pager-controls">
        {onPageSize ? (
          <label className="field pager-size">
            Page size
            <select
              className="input"
              value={pageSize}
              onChange={(event) => onPageSize(Number(event.target.value))}
            >
              {TABLE_PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {onFirst && hasPrev ? (
          <button type="button" className="btn" onClick={onFirst}>
            First
          </button>
        ) : null}
        {onPrev ? (
          <button type="button" className="btn" onClick={onPrev} disabled={!hasPrev}>
            Previous
          </button>
        ) : null}
        {onNext ? (
          <button
            type="button"
            className="btn"
            onClick={onNext}
            disabled={!hasNext}
          >
            Next
          </button>
        ) : null}
      </div>
    </div>
  )
}
