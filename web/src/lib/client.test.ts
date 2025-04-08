import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest } from './client'

describe('API client', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('surfaces the backend error detail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: { detail: 'a sync is already running' } }),
    }))

    await expect(apiRequest('/defi/sync-runs', { method: 'POST' })).rejects.toEqual(
      new ApiError(409, 'a sync is already running'),
    )
  })
})
