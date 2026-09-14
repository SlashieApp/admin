import { formatChangePct } from '@/lib/opsRange'

export type OpsCount = {
  current: number
  previous?: number | null
  percentChange?: number | null
}

export type CoreOpsCounts = {
  newUsers: OpsCount
  tasksCreated: OpsCount
  workersRegistered: OpsCount
}

export type StatusCount = {
  status: string
  count: number
}

export type DayUsers = {
  day: string
  users: number
}

export type ChangeDirection = 'up' | 'down' | 'flat'

export type KpiCardModel = {
  key: 'newUsers' | 'tasksCreated' | 'workersRegistered'
  label: string
  shortName: string
  current: number
  previous: number | null
  percentChange: number | null
  deltaLabel: string
  direction: ChangeDirection
  sparkline: number[]
}

export type ComparisonBar = {
  name: string
  current: number
  previous: number
}

export type StatusBar = {
  name: string
  count: number
}

export type TrendPoint = {
  name: string
  users: number
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export function changeDirection(value?: number | null): ChangeDirection {
  if (value == null || Number.isNaN(Number(value)) || Number(value) === 0) {
    return 'flat'
  }
  return Number(value) > 0 ? 'up' : 'down'
}

/** Honest two-point sparkline from period totals — never invents extra days. */
export function sparklineFromCount(count: OpsCount): number[] {
  if (count.previous == null) return [count.current]
  return [count.previous, count.current]
}

/** Compact axis label so ISO timestamps never force horizontal scroll. */
export function formatTrendLabel(day: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(day.trim())
  if (!match) return day
  const month = MONTHS[Number(match[2]) - 1]
  if (!month) return day
  return `${Number(match[3])} ${month}`
}

/** Status enums stay readable as text, not color chips alone. */
export function humanizeStatus(status: string): string {
  const trimmed = status.trim()
  if (!trimmed) return status
  return trimmed
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const CORE_KPI_META: Array<{
  key: KpiCardModel['key']
  label: string
  shortName: string
}> = [
  { key: 'newUsers', label: 'New users', shortName: 'Users' },
  { key: 'tasksCreated', label: 'Tasks created', shortName: 'Tasks' },
  {
    key: 'workersRegistered',
    label: 'Workers registered',
    shortName: 'Workers',
  },
]

export function toCoreKpis(
  ops: CoreOpsCounts | null | undefined,
): KpiCardModel[] {
  if (!ops) return []
  return CORE_KPI_META.map(({ key, label, shortName }) => {
    const count = ops[key]
    const percentChange = count.percentChange ?? null
    return {
      key,
      label,
      shortName,
      current: count.current,
      previous: count.previous ?? null,
      percentChange,
      deltaLabel: formatChangePct(percentChange),
      direction: changeDirection(percentChange),
      sparkline: sparklineFromCount(count),
    }
  })
}

export function toComparisonBars(kpis: KpiCardModel[]): ComparisonBar[] {
  return kpis.map((kpi) => ({
    name: kpi.shortName,
    current: kpi.current,
    previous: kpi.previous ?? 0,
  }))
}

export function toStatusBars(rows?: StatusCount[] | null): StatusBar[] {
  if (!rows?.length) return []
  return rows.map((row) => ({
    name: humanizeStatus(row.status),
    count: row.count,
  }))
}

export function toDauSeries(rows?: DayUsers[] | null): TrendPoint[] {
  if (!rows?.length) return []
  return rows.map((row) => ({
    name: formatTrendLabel(row.day),
    users: row.users,
  }))
}

export function hasRenderableSeries(
  kpis: KpiCardModel[],
  status: StatusBar[],
  dau: TrendPoint[],
): boolean {
  return kpis.length > 0 || status.length > 0 || dau.length > 0
}
