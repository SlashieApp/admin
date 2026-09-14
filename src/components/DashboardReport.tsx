import Link from 'next/link'

import type { AdminOpsSummaryQuery } from '@codegen/schema'
import {
  ADMIN_OPS_RANGES,
  formatChangePct,
  type AdminOpsRange,
} from '@/lib/opsRange'
import {
  isIncompleteSuccessCapture,
  productEventLabel,
} from '@/lib/posthogEvents'
import type { ProductDashboardMetrics } from '@/server/posthog'

type OpsCount = {
  current: number
  previous?: number | null
  percentChange?: number | null
}

type Props = {
  range: AdminOpsRange
  ops: AdminOpsSummaryQuery['adminOpsSummary'] | null
  opsBanner: string | null
  product: ProductDashboardMetrics
}

export function DashboardReport({ range, ops, opsBanner, product }: Props) {
  return (
    <section className="stack">
      <div>
        <h1>Dashboard</h1>
        <p className="muted">
          Weekly / monthly ops report. Mongo counts are source of truth when
          BE-44 <code>adminOpsSummary</code> is deployed. PostHog is
          complementary product analytics.
        </p>
      </div>

      <nav className="tabs" aria-label="Ops range">
        {ADMIN_OPS_RANGES.map((row) => (
          <Link
            key={row.value}
            href={`/dashboard?range=${row.value}`}
            className={range === row.value ? 'tab is-active' : 'tab'}
          >
            {row.label}
          </Link>
        ))}
      </nav>

      {opsBanner ? <p className="banner banner-warn">{opsBanner}</p> : null}

      <h2 className="section-heading">Hard counts (Mongo / Apollo)</h2>
      {ops ? (
        <>
          <div className="metrics">
            <MetricCard label="New users" count={ops.newUsers} />
            <MetricCard label="Tasks created" count={ops.tasksCreated} />
            <MetricCard
              label="Workers registered"
              count={ops.workersRegistered}
            />
            <OptionalCount label="Quotes sent" count={ops.quotesSent} />
            <OptionalCount label="Quotes accepted" count={ops.quotesAccepted} />
            <OptionalCount label="Quotes declined" count={ops.quotesDeclined} />
            <OptionalCount label="Orders opened" count={ops.ordersOpened} />
            <OptionalCount label="Jobs completed" count={ops.jobsCompleted} />
            <OptionalCount label="Jobs confirmed" count={ops.jobsConfirmed} />
            <OptionalCount
              label="Reports submitted"
              count={ops.reportsSubmitted}
            />
          </div>
          <dl className="kv">
            <div>
              <dt>Open reports</dt>
              <dd>
                <Link href="/reports" className="inline-link">
                  {ops.openReports ?? '—'}
                </Link>
              </dd>
            </div>
            <div>
              <dt>Hidden tasks</dt>
              <dd>{ops.hiddenTasks ?? '—'}</dd>
            </div>
            <div>
              <dt>Disabled users</dt>
              <dd>{ops.disabledUsers ?? '—'}</dd>
            </div>
          </dl>
          {ops.tasksByStatus?.length ? (
            <article className="section">
              <h2>Tasks by status</h2>
              <ul className="list">
                {ops.tasksByStatus.map((row) => (
                  <li key={row.status} className="card card-pad">
                    <div className="card-top">
                      <strong>{row.status}</strong>
                      <span className="pill">{row.count}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}
        </>
      ) : (
        <p className="muted">No Mongo ops summary for this range.</p>
      )}

      <h2 className="section-heading">PostHog product metrics</h2>
      <p className="muted">
        Some <code>*_success</code> captures may be incomplete until{' '}
        <a
          className="inline-link"
          href="https://linear.app/slashie/issue/FE-153"
        >
          FE-153
        </a>
        . Queried server-side with a personal API key (never sent to the
        browser).
      </p>
      {!product.configured ? (
        <p className="banner banner-warn">
          PostHog env is not set. Add <code>POSTHOG_PERSONAL_API_KEY</code> and{' '}
          <code>POSTHOG_PROJECT_ID</code> (optional <code>POSTHOG_HOST</code>,
          defaults to eu.posthog.com).
        </p>
      ) : null}
      {product.error ? (
        <p className="banner banner-error">{product.error}</p>
      ) : null}
      {product.configured && !product.error ? (
        <>
          <div className="metrics">
            {product.totals.length === 0
              ? DASHBOARD_EMPTY_EVENTS.map((event) => (
                  <article key={event} className="metric">
                    <p className="metric-label">
                      {productEventLabel(event)}
                      {isIncompleteSuccessCapture(event) ? (
                        <span className="pill">FE-153</span>
                      ) : null}
                    </p>
                    <p className="metric-value">0</p>
                    <p className="meta">0 unique</p>
                  </article>
                ))
              : product.totals.map((row) => (
                  <article key={row.event} className="metric">
                    <p className="metric-label">
                      {productEventLabel(row.event)}
                      {isIncompleteSuccessCapture(row.event) ? (
                        <span className="pill">FE-153</span>
                      ) : null}
                    </p>
                    <p className="metric-value">{row.count}</p>
                    <p className="meta">{row.users} unique</p>
                  </article>
                ))}
          </div>
          <article className="section">
            <h2>This week strip — $pageview DAU</h2>
            {product.dau.length === 0 ? (
              <p className="muted">No pageview users in this range.</p>
            ) : (
              <ul className="list">
                {product.dau.map((row) => (
                  <li key={row.day} className="card card-pad">
                    <div className="card-top">
                      <strong>{row.day}</strong>
                      <span className="pill">{row.users} DAU</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </>
      ) : null}
    </section>
  )
}

const DASHBOARD_EMPTY_EVENTS = [
  'register_success',
  'login_success',
  'task_create_success',
  'worker_setup_success',
  '$pageview',
]

function OptionalCount({
  label,
  count,
}: {
  label: string
  count?: OpsCount | null
}) {
  if (!count) return null
  return <MetricCard label={label} count={count} />
}

function MetricCard({ label, count }: { label: string; count: OpsCount }) {
  const delta = formatChangePct(count.percentChange)
  const up = (count.percentChange ?? 0) > 0
  const down = (count.percentChange ?? 0) < 0
  return (
    <article className="metric">
      <p className="metric-label">{label}</p>
      <p className="metric-value">{count.current}</p>
      <p
        className={
          up ? 'meta is-up' : down ? 'meta is-down' : 'meta'
        }
      >
        {delta}
        {count.previous != null ? ` vs ${count.previous} prior` : ''}
      </p>
    </article>
  )
}
