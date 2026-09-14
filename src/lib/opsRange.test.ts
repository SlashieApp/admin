import { describe, expect, it } from 'vitest'

import {
  formatChangePct,
  parseAdminOpsRange,
  rangeToHogqlWhere,
} from './opsRange'

describe('parseAdminOpsRange', () => {
  it('defaults to last 7 days for the weekly report', () => {
    expect(parseAdminOpsRange(null)).toBe('LAST_7_DAYS')
    expect(parseAdminOpsRange('nope')).toBe('LAST_7_DAYS')
  })

  it('accepts month windows', () => {
    expect(parseAdminOpsRange('LAST_30_DAYS')).toBe('LAST_30_DAYS')
    expect(parseAdminOpsRange('THIS_MONTH')).toBe('THIS_MONTH')
    expect(parseAdminOpsRange('LAST_MONTH')).toBe('LAST_MONTH')
  })
})

describe('rangeToHogqlWhere', () => {
  it('uses a rolling window or calendar month', () => {
    expect(rangeToHogqlWhere('LAST_7_DAYS')).toContain('INTERVAL 7 DAY')
    expect(rangeToHogqlWhere('LAST_30_DAYS')).toContain('INTERVAL 30 DAY')
    expect(rangeToHogqlWhere('THIS_MONTH')).toContain('toStartOfMonth')
    expect(rangeToHogqlWhere('LAST_MONTH')).toContain('INTERVAL 1 MONTH')
  })
})

describe('formatChangePct', () => {
  it('renders signed percents and an em dash when unknown', () => {
    expect(formatChangePct(12.34)).toBe('+12.3%')
    expect(formatChangePct(-4)).toBe('-4%')
    expect(formatChangePct(null)).toBe('—')
  })
})
