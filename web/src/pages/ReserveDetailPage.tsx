import { lazy, Suspense, useEffect, useState } from 'react'
import { Alert, Button, Segmented, Skeleton, Tag } from 'antd'
import { ArrowLeft, CircleDollarSign } from 'lucide-react'
import { api } from '../lib/client'
import { formatCurrency, formatPercent } from '../lib/format'
import type { Reserve, ReserveSnapshot } from '../lib/types'

const TrendChart = lazy(() => import('../components/TrendChart').then((module) => ({
  default: module.TrendChart,
})))

export function ReserveDetailPage({ reserve, onBack }: { reserve: Reserve; onBack: () => void }) {
  const [snapshots, setSnapshots] = useState<ReserveSnapshot[]>([])
  const [range, setRange] = useState('30d')
  const [mode, setMode] = useState<'liquidity' | 'rates'>('liquidity')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api.snapshots(reserve.id, range).then((data) => {
      setSnapshots(data)
      setError('')
    }).catch((cause) => setError(cause instanceof Error ? cause.message : '趋势加载失败')).finally(() => setLoading(false))
  }, [reserve.id, range])

  return (
    <div className="page page-enter">
      <button type="button" className="back-link" onClick={onBack}><ArrowLeft size={17} /> 返回市场列表</button>
      <header className="page-header reserve-header">
        <div><div className="eyebrow">AAVE RESERVE / {reserve.symbol}</div><h1>{reserve.name}</h1><p className="address">{reserve.underlying_asset}</p></div>
        <div className="asset-badge"><CircleDollarSign size={24} />{reserve.symbol}</div>
      </header>
      <section className="detail-metrics">
        <div><span>供应量</span><strong>{formatCurrency(reserve.total_supplied_usd)}</strong></div>
        <div><span>借款量</span><strong>{formatCurrency(reserve.total_borrowed_usd)}</strong></div>
        <div><span>利用率</span><strong>{formatPercent(reserve.utilization_rate)}</strong></div>
        <div><span>供应 / 借款 APY</span><strong>{formatPercent(reserve.supply_apy)} / {formatPercent(reserve.variable_borrow_apy)}</strong></div>
      </section>
      <section className="data-panel chart-panel">
        <div className="panel-heading chart-controls">
          <div><span>HISTORICAL SERIES</span><h2>{mode === 'liquidity' ? '供应量与借款量' : '供应与借款 APY'}</h2></div>
          <div><Segmented value={mode} onChange={(value) => setMode(value as typeof mode)} options={[{ label: '流动性', value: 'liquidity' }, { label: '利率', value: 'rates' }]} /><Segmented value={range} onChange={(value) => setRange(String(value))} options={['7d', '30d', '90d']} /></div>
        </div>
        <div className="chart-legend"><span className="blue" />{mode === 'rates' ? '供应 APY' : '供应量'}<span className="amber" />{mode === 'rates' ? '借款 APY' : '借款量'}<Tag>{snapshots.length} POINTS</Tag></div>
        {error ? <Alert type="error" message={error} showIcon /> : null}
        {loading ? <Skeleton active paragraph={{ rows: 8 }} /> : (
          <Suspense fallback={<Skeleton active paragraph={{ rows: 8 }} />}>
            <TrendChart snapshots={snapshots} mode={mode} />
          </Suspense>
        )}
      </section>
    </div>
  )
}
