import { describe, expect, it } from 'vitest'

import {
  changeDirection,
  hasRenderableSeries,
  sparklineFromCount,
  toComparisonBars,
  toCoreKpis,
  toDauSeries,
  toStatusBars,
} from './dashboardCharts'

describe('changeDirection', () => {
  it('uses up/down/flat so charts never rely on color alone', () => {
    expect(changeDirection(12)).toBe('up')
    expect(changeDirection(-0.4)).toBe('down')
    expect(changeDirection(0)).toBe('flat')
    expect(changeDirection(null)).toBe('flat')
  })
})

describe('sparklineFromCount', () => {
  it('synthesizes only previous→current — does not invent extra days', () => {
    expect(
      sparklineFromCount({ current: 20, previous: 10, percentChange: 100 }),
    ).toEqual([10, 20])
  })

  it('falls back to a single current point when previous is missing', () => {
    expect(sparklineFromCount({ current: 7 })).toEqual([7])
  })
})

describe('toCoreKpis', () => {
  it('returns empty when ops summary is missing', () => {
    expect(toCoreKpis(null)).toEqual([])
    expect(toCoreKpis(undefined)).toEqual([])
  })

  it('maps the three founder KPIs with numeric values and % change labels', () => {
    const kpis = toCoreKpis({
      newUsers: { current: 12, previous: 8, percentChange: 50 },
      tasksCreated: { current: 40, previous: 50, percentChange: -20 },
      workersRegistered: { current: 3, previous: 3, percentChange: 0 },
    })
    expect(kpis).toHaveLength(3)
    expect(kpis[0]).toMatchObject({
      key: 'newUsers',
      label: 'New users',
      current: 12,
      previous: 8,
      deltaLabel: '+50%',
      direction: 'up',
      sparkline: [8, 12],
    })
    expect(kpis[1]?.direction).toBe('down')
    expect(kpis[1]?.deltaLabel).toBe('-20%')
    expect(kpis[2]?.direction).toBe('flat')
  })
})

describe('toComparisonBars', () => {
  it('exposes current vs previous for grouped bars', () => {
    const kpis = toCoreKpis({
      newUsers: { current: 12, previous: 8, percentChange: 50 },
      tasksCreated: { current: 40, previous: null, percentChange: null },
      workersRegistered: { current: 3, previous: 1, percentChange: 200 },
    })
    expect(toComparisonBars(kpis)).toEqual([
      { name: 'New users', current: 12, previous: 8 },
      { name: 'Tasks created', current: 40, previous: 0 },
      { name: 'Workers registered', current: 3, previous: 1 },
    ])
  })
})

describe('toStatusBars', () => {
  it('keeps status names as text so color is not the only signal', () => {
    expect(toStatusBars(null)).toEqual([])
    expect(
      toStatusBars([
        { status: 'OPEN', count: 9 },
        { status: 'COMPLETED', count: 2 },
      ]),
    ).toEqual([
      { name: 'OPEN', count: 9 },
      { name: 'COMPLETED', count: 2 },
    ])
  })
})

describe('toDauSeries', () => {
  it('maps PostHog $pageview DAU into a trend series', () => {
    expect(toDauSeries([])).toEqual([])
    expect(
      toDauSeries([
        { day: '2026-09-07', users: 4 },
        { day: '2026-09-08', users: 6 },
      ]),
    ).toEqual([
      { name: '2026-09-07', users: 4 },
      { name: '2026-09-08', users: 6 },
    ])
  })
})

describe('hasRenderableSeries', () => {
  it('is false when every chart source is empty', () => {
    expect(hasRenderableSeries([], [], [])).toBe(false)
  })

  it('is true when any KPI, status, or DAU series exists', () => {
    const kpis = toCoreKpis({
      newUsers: { current: 1 },
      tasksCreated: { current: 0 },
      workersRegistered: { current: 0 },
    })
    expect(hasRenderableSeries(kpis, [], [])).toBe(true)
    expect(hasRenderableSeries([], [{ name: 'OPEN', count: 1 }], [])).toBe(true)
    expect(hasRenderableSeries([], [], [{ name: 'Mon', users: 2 }])).toBe(true)
  })
})
