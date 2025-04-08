import { beforeEach, describe, expect, it } from 'vitest'
import { clearToken, getToken, setToken } from './auth'

describe('token storage', () => {
  beforeEach(() => localStorage.clear())

  it('stores and clears the bearer token', () => {
    setToken('jwt-value')
    expect(getToken()).toBe('jwt-value')

    clearToken()
    expect(getToken()).toBeNull()
  })
})
