import { describe, expect, it } from 'vitest'
import { copy, errorMessage, sourceLabel, statusLabel } from './copy'

describe('english copy', () => {
  it('maps internal statuses and sources to product labels', () => {
    expect(statusLabel('succeeded')).toBe('Succeeded')
    expect(statusLabel('unknown')).toBe('Unknown')
    expect(sourceLabel('demo')).toBe('Demo index')
    expect(sourceLabel('graph')).toBe('The Graph')
  })

  it('provides complete copy groups and safe error fallbacks', () => {
    expect(copy.auth.signIn).toBe('Sign in')
    expect(copy.overview.title).toBe('Protocol pulse')
    expect(errorMessage(new Error('后端错误'), copy.common.loadError)).toBe(copy.common.loadError)
  })
})
