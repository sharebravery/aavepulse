export interface ApiEnvelope<T> {
  success: boolean
  data: T
  total?: number
}

export interface Overview {
  total_supplied_usd: string
  total_borrowed_usd: string
  available_liquidity_usd: string
  utilization_rate: string
  reserve_count: number
  last_synced_at: string
  demo: boolean
}

export interface Reserve {
  id: string
  symbol: string
  name: string
  underlying_asset: string
  total_supplied_usd: string
  total_borrowed_usd: string
  available_liquidity_usd: string
  utilization_rate: string
  supply_apy: string
  variable_borrow_apy: string
  price_usd: string
  data_updated_at: string
  demo: boolean
}

export interface ReserveSnapshot {
  id: string
  reserve_id: string
  total_supplied_usd: string
  total_borrowed_usd: string
  available_liquidity_usd: string
  utilization_rate: string
  supply_apy: string
  variable_borrow_apy: string
  price_usd: string
  snapshot_at: string
  demo: boolean
}

export interface SyncRun {
  id: string
  status: 'running' | 'succeeded' | 'failed'
  source: 'demo' | 'graph'
  read_count: number
  written_count: number
  error_summary?: string
  started_at: string
  finished_at?: string
}

export interface LoginToken {
  access_token: string
  token_type: string
  expires_at: number
}
