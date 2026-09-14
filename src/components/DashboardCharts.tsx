'use client'

import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type {
  ComparisonBar,
  KpiCardModel,
  StatusBar,
  TrendPoint,
} from '@/lib/dashboardCharts'
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion'

const INK = '#0B1714'
const MUTED = '#3F4B45'
const GRID = '#D1D5D4'
const BRAND = '#00DC82'
const PREVIOUS = '#6B7370'
const TREND = '#0B6B45'

const tooltipStyle = {
  background: '#FFFFFF',
  border: `1px solid ${GRID}`,
  borderRadius: 12,
  color: INK,
  fontSize: 13,
}

type Props = {
  kpis: KpiCardModel[]
  comparison: ComparisonBar[]
  status: StatusBar[]
  dau: TrendPoint[]
  emptyReason?: string | null
}

export function DashboardCharts({
  kpis,
  comparison,
  status,
  dau,
  emptyReason,
}: Props) {
  const reduced = usePrefersReducedMotion()
  const animate = !reduced

  return (
    <div className="dashboard-bento">
      <section className="kpi-grid" aria-label="Core ops KPIs">
        {kpis.length === 0
          ? ['New users', 'Tasks created', 'Workers registered'].map(
              (label) => (
                <article
                  key={label}
                  className="metric metric-kpi"
                  aria-busy="true"
                >
                  <p className="metric-label">{label}</p>
                  <div className="skeleton skeleton-value" />
                  <p className="meta">No Mongo count for this range</p>
                </article>
              ),
            )
          : kpis.map((kpi) => (
              <KpiCard key={kpi.key} kpi={kpi} animate={animate} />
            ))}
      </section>

      {emptyReason &&
      kpis.length === 0 &&
      status.length === 0 &&
      dau.length === 0 ? (
        <p className="banner banner-warn">{emptyReason}</p>
      ) : null}

      {dau.length > 0 ? (
        <article className="section chart-card">
          <h3>Daily active users</h3>
          <p className="muted">PostHog $pageview unique users by day.</p>
          <div
            className="chart-frame"
            role="img"
            aria-label="Daily active users trend"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dau}
                margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke={GRID} strokeDasharray="4 4" />
                <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 12 }} />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: MUTED, fontSize: 12 }}
                  width={36}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  name="DAU"
                  stroke={TREND}
                  strokeWidth={2}
                  dot={{ r: 3, fill: BRAND, stroke: TREND }}
                  isAnimationActive={animate}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <ChartTable
            caption="Daily active users"
            headers={['Day', 'Users']}
            rows={dau.map((row) => [row.name, String(row.users)])}
          />
        </article>
      ) : null}

      <div className="chart-grid">
        {comparison.length > 0 ? (
          <article className="section chart-card">
            <h3>Current vs previous period</h3>
            <p className="muted">
              Grouped bars for the three core KPIs. Numbers are also listed
              below.
            </p>
            <div
              className="chart-frame"
              role="img"
              aria-label="Current versus previous period for users, tasks, and workers"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={comparison}
                  margin={{ top: 24, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke={GRID} strokeDasharray="4 4" />
                  <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 12 }} />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: MUTED, fontSize: 12 }}
                    width={36}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar
                    dataKey="previous"
                    name="Previous"
                    fill={PREVIOUS}
                    radius={[8, 8, 0, 0]}
                    isAnimationActive={animate}
                  >
                    <LabelList
                      dataKey="previous"
                      position="top"
                      fill={INK}
                      fontSize={12}
                    />
                  </Bar>
                  <Bar
                    dataKey="current"
                    name="Current"
                    fill={BRAND}
                    radius={[8, 8, 0, 0]}
                    isAnimationActive={animate}
                  >
                    <LabelList
                      dataKey="current"
                      position="top"
                      fill={INK}
                      fontSize={12}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ChartTable
              caption="Current versus previous period"
              headers={['Metric', 'Current', 'Previous']}
              rows={comparison.map((row) => [
                row.name,
                String(row.current),
                String(row.previous),
              ])}
            />
          </article>
        ) : null}

        {status.length > 0 ? (
          <article className="section chart-card">
            <h3>Tasks by status</h3>
            <p className="muted">
              Open marketplace snapshot — labels and counts, not color alone.
            </p>
            <div
              className="chart-frame chart-frame-status"
              role="img"
              aria-label="Tasks by status horizontal bar chart"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={status}
                  margin={{ top: 8, right: 36, left: 4, bottom: 0 }}
                >
                  <CartesianGrid stroke={GRID} strokeDasharray="4 4" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: MUTED, fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={96}
                    tick={{ fill: INK, fontSize: 12 }}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar
                    dataKey="count"
                    name="Tasks"
                    fill={BRAND}
                    radius={[0, 8, 8, 0]}
                    isAnimationActive={animate}
                  >
                    <LabelList
                      dataKey="count"
                      position="right"
                      fill={INK}
                      fontSize={12}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ChartTable
              caption="Tasks by status"
              headers={['Status', 'Count']}
              rows={status.map((row) => [row.name, String(row.count)])}
            />
          </article>
        ) : null}
      </div>
    </div>
  )
}

function KpiCard({ kpi, animate }: { kpi: KpiCardModel; animate: boolean }) {
  const Icon =
    kpi.direction === 'up'
      ? TrendingUp
      : kpi.direction === 'down'
        ? TrendingDown
        : Minus
  const tone =
    kpi.direction === 'up'
      ? 'delta is-up'
      : kpi.direction === 'down'
        ? 'delta is-down'
        : 'delta'
  const spark = kpi.sparkline.map((value, index) => ({ i: index, v: value }))

  return (
    <article className="metric metric-kpi">
      <p className="metric-label">{kpi.label}</p>
      <p className="metric-value">{kpi.current}</p>
      <p className={tone}>
        <Icon size={16} aria-hidden />
        <span>
          {kpi.deltaLabel}
          {kpi.direction === 'up'
            ? ' up'
            : kpi.direction === 'down'
              ? ' down'
              : ' unchanged'}
          {kpi.previous != null ? ` vs ${kpi.previous} prior` : ''}
        </span>
      </p>
      {spark.length > 1 ? (
        <div className="sparkline" aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={spark}
              margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
            >
              <Area
                type="monotone"
                dataKey="v"
                stroke={TREND}
                fill={BRAND}
                fillOpacity={0.22}
                isAnimationActive={animate}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </article>
  )
}

function ChartTable({
  caption,
  headers,
  rows,
}: {
  caption: string
  headers: string[]
  rows: string[][]
}) {
  return (
    <div className="chart-table-wrap">
      <table className="chart-table">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join('-')}>
              {row.map((cell, index) => (
                <td key={`${cell}-${index}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
