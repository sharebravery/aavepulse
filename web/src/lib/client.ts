import md5 from 'blueimp-md5'
import { clearToken, getToken } from './auth'
import type {
  ApiEnvelope,
  LoginToken,
  Overview,
  Reserve,
  ReserveSnapshot,
  SyncRun,
} from './types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body) headers.set('Content-Type', 'application/json')
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401) clearToken()
    const message = payload?.error?.detail || `Request failed (${response.status})`
    throw new ApiError(response.status, message)
  }
  return payload as T
}

export const api = {
  async captcha(): Promise<{ captchaID: string; enabled: boolean }> {
    const response = await apiRequest<ApiEnvelope<{ captcha_id: string; captcha_enabled: boolean }>>('/captcha/id')
    return {
      captchaID: response.data.captcha_id,
      enabled: response.data.captcha_enabled,
    }
  },

  captchaImage(captchaID: string): string {
    return `${API_BASE}/captcha/image?id=${encodeURIComponent(captchaID)}`
  },

  async login(username: string, password: string, captchaID: string, captchaCode: string): Promise<LoginToken> {
    const response = await apiRequest<ApiEnvelope<LoginToken>>('/login', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password: md5(password),
        captcha_id: captchaID,
        captcha_code: captchaCode,
      }),
    })
    return response.data
  },

  async overview(): Promise<Overview> {
    return (await apiRequest<ApiEnvelope<Overview>>('/defi/overview')).data
  },

  async reserves(query = ''): Promise<{ data: Reserve[]; total: number }> {
    const response = await apiRequest<ApiEnvelope<Reserve[]>>(`/defi/reserves${query}`)
    return { data: response.data, total: response.total || 0 }
  },

  async reserve(id: string): Promise<Reserve> {
    return (await apiRequest<ApiEnvelope<Reserve>>(`/defi/reserves/${id}`)).data
  },

  async snapshots(id: string, range: string): Promise<ReserveSnapshot[]> {
    const query = new URLSearchParams({ range })
    return (await apiRequest<ApiEnvelope<ReserveSnapshot[]>>(`/defi/reserves/${id}/snapshots?${query}`)).data
  },

  async syncRuns(): Promise<{ data: SyncRun[]; total: number }> {
    const response = await apiRequest<ApiEnvelope<SyncRun[]>>('/defi/sync-runs')
    return { data: response.data, total: response.total || 0 }
  },

  async runSync(): Promise<SyncRun> {
    return (await apiRequest<ApiEnvelope<SyncRun>>('/defi/sync-runs', { method: 'POST' })).data
  },
}
