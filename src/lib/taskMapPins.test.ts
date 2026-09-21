import { describe, expect, it } from 'vitest'

import { pinAriaLabel, pinsFromTasks } from './taskMapPins'

describe('pinsFromTasks', () => {
  it('keeps only tasks with finite coordinates', () => {
    const pins = pinsFromTasks([
      {
        id: '1',
        title: 'Leaky tap',
        status: 'OPEN',
        budget: { amount: 80, currency: 'GBP' },
        location: { lat: 51.5, lng: -0.12, name: 'Camden' },
      },
      {
        id: '2',
        title: 'No pin',
        location: { name: 'Unknown' },
      },
      {
        id: '3',
        title: 'String coords',
        location: { lat: '51.51' as unknown as number, lng: '-0.1' as unknown as number },
      },
    ])
    expect(pins.map((pin) => pin.id)).toEqual(['1', '3'])
    expect(pins[0]?.priceLabel).toBe('GBP 80')
    expect(pinAriaLabel(pins[0]!)).toContain('Leaky tap')
  })
})
