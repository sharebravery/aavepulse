import { describe, expect, it } from 'vitest'
import { formatCurrency, formatPercent } from './format'

describe('metric formatting', () => {
  it('formats large USD values compactly', () => {
    expect(formatCurrency('1234567890.12')).toBe('$1.23B')
    expect(formatCurrency('4200000')).toBe('$4.20M')
  })

  it('formats decimal ratios as percentages', () => {
    expect(formatPercent('0.041')).toBe('4.10%')
    expect(formatPercent('0')).toBe('0.00%')
  })
})
