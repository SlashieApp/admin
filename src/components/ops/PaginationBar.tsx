import { PAGE_SIZES, type PageSize } from '@/lib/listQuery'

type Props = {
  shownCount: number
  fetchedCount: number
  pageSize: PageSize
  onPageSize: (next: PageSize) => void
  canPrev: boolean
  canNext: boolean
  onPrev?: () => void
  onNext?: () => void
  nextDisabledReason?: string | null
  filtered?: boolean
}

export function PaginationBar({
  shownCount,
  fetchedCount,
  pageSize,
  onPageSize,
  canPrev,
  canNext,
  onPrev,
  onNext,
  nextDisabledReason,
  filtered,
}: Props) {
  return (
    <div className="pagination-bar">
      <p className="pagination-meta">
        {filtered && shownCount !== fetchedCount
          ? `Showing ${shownCount} of ${fetchedCount} on this API page`
          : `Showing ${shownCount} on this API page`}
      </p>
      <label className="pagination-size">
        Page size
        <select
          className="input"
          value={pageSize}
          aria-label="Page size"
          onChange={(event) =>
            onPageSize(Number(event.target.value) as PageSize)
          }
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
      <div className="pagination-nav">
        <button
          type="button"
          className="btn"
          disabled={!canPrev}
          onClick={onPrev}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn"
          disabled={!canNext}
          title={!canNext ? (nextDisabledReason ?? undefined) : undefined}
          onClick={onNext}
        >
          Next
        </button>
      </div>
      {nextDisabledReason && !canNext ? (
        <p className="filter-note">{nextDisabledReason}</p>
      ) : null}
    </div>
  )
}
