import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDateTime, formatNumber, formatPercent } from './format'

describe('metric formatting', () => {
  it('formats large USD values compactly', () => {
    expect(formatCurrency('1234567890.12')).toBe('$1.23B')
    expect(formatCurrency('4200000')).toBe('$4.20M')
  })

  it('formats decimal ratios as percentages', () => {
    expect(formatPercent('0.041')).toBe('4.10%')
    expect(formatPercent('0')).toBe('0.00%')
  })

  it('formats counts with English grouping', () => {
    expect(formatNumber(1234567)).toBe('1,234,567')
  })

  it('formats timestamps with the English locale and safe fallbacks', () => {
    expect(formatDateTime('2026-07-14T08:05:00Z')).toMatch(/07\/14/)
    expect(formatDateTime()).toBe('Not synced yet')
    expect(formatDateTime('invalid')).toBe('Unknown time')
  })
})
