import { describe, expect, it } from 'vitest'
import { formatTokenSymbol, getUtilizationTone } from './design'

describe('design tokens', () => {
  it('formats symbols for compact token labels', () => {
    expect(formatTokenSymbol('USDC')).toBe('USDC')
    expect(formatTokenSymbol('wrapped-staked-ether')).toBe('WRAP')
    expect(formatTokenSymbol('')).toBe('TOKEN')
  })

  it('maps utilization to semantic risk tones', () => {
    expect(getUtilizationTone(-0.1)).toBe('mint')
    expect(getUtilizationTone(0.6)).toBe('blue')
    expect(getUtilizationTone(0.81)).toBe('amber')
  })
})
