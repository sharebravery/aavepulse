import { lazy, Suspense, useEffect, useState } from 'react'
import { ArrowLeft, ExternalLink, LineChart, Percent, WalletCards } from 'lucide-react'
import { api } from '../lib/client'
import { copy, errorMessage } from '../lib/copy'
import { formatCurrency, formatPercent } from '../lib/format'
import type { Reserve, ReserveSnapshot } from '../lib/types'
import { PageIntro } from '../components/PageIntro'
import { StatusPill } from '../components/StatusPill'
import { TokenOrb } from '../components/TokenOrb'
import { UtilizationBar } from '../components/UtilizationBar'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip'

const TrendChart = lazy(() => import('../components/TrendChart').then((module) => ({ default: module.TrendChart })))

export function ReserveDetailPage({ reserve, onBack }: { reserve: Reserve; onBack: () => void }) {
  const [snapshots, setSnapshots] = useState<ReserveSnapshot[]>([])
  const [range, setRange] = useState('30d')
  const [mode, setMode] = useState<'liquidity' | 'rates'>('liquidity')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api.snapshots(reserve.id, range).then((data) => { setSnapshots(data); setError('') }).catch((cause) => setError(errorMessage(cause, copy.detail.trendError))).finally(() => setLoading(false))
  }, [reserve.id, range])

  return (
    <div className="animate-page-in mx-auto max-w-[1480px] px-5 py-6 md:px-8 md:py-9">
      <Button variant="ghost" size="sm" className="mb-5 -ml-3" onClick={onBack}><ArrowLeft className="h-4 w-4" />{copy.detail.backToMarkets}</Button>
      <PageIntro eyebrow={`Aave reserve / ${reserve.symbol}`} title={reserve.name} description={copy.detail.description} actions={<><StatusPill status="neutral" label={reserve.demo ? copy.detail.demoAsset : copy.detail.indexedAsset} /><TokenOrb symbol={reserve.symbol} size="lg" /></>} />
      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-muted"><WalletCards className="h-4 w-4 text-cyan" /><TooltipProvider><Tooltip><TooltipTrigger asChild><span className="max-w-[280px] cursor-help truncate font-mono text-muted underline decoration-dotted underline-offset-4">{reserve.underlying_asset}</span></TooltipTrigger><TooltipContent>{reserve.underlying_asset}</TooltipContent></Tooltip></TooltipProvider><ExternalLink className="h-3.5 w-3.5" /><span className="font-mono text-[10px] uppercase tracking-[0.12em]">{copy.detail.network}</span></div>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DetailMetric label={copy.detail.totalSupplied} value={formatCurrency(reserve.total_supplied_usd)} icon={<WalletCards className="h-4 w-4" />} /><DetailMetric label={copy.detail.totalBorrowed} value={formatCurrency(reserve.total_borrowed_usd)} icon={<LineChart className="h-4 w-4" />} /><div className="rounded-card border border-line bg-surface p-4"><span className="flex items-center justify-between text-xs text-muted"><span>{copy.detail.utilization}</span><Percent className="h-4 w-4 text-amber" /></span><strong className="mt-5 block font-mono text-2xl font-medium text-amber">{formatPercent(reserve.utilization_rate)}</strong><UtilizationBar className="mt-3" value={reserve.utilization_rate} showValue /></div><DetailMetric label={copy.detail.supplyBorrowApy} value={`${formatPercent(reserve.supply_apy)} / ${formatPercent(reserve.variable_borrow_apy)}`} icon={<Percent className="h-4 w-4" />} tone="mint" />
      </section>

      <section className="panel-sheen overflow-hidden rounded-panel border border-line bg-surface">
        <div className="flex flex-col justify-between gap-4 border-b border-line px-5 py-5 md:flex-row md:items-center"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan">{copy.detail.historicalSeries}</p><h2 className="mt-1 text-lg font-medium">{mode === 'liquidity' ? copy.detail.liquidityTitle : copy.detail.ratesTitle}</h2></div><div className="flex flex-wrap gap-2"><Tabs value={mode} onValueChange={(value) => setMode(value as typeof mode)}><TabsList><TabsTrigger value="liquidity">{copy.detail.liquidity}</TabsTrigger><TabsTrigger value="rates">{copy.detail.rates}</TabsTrigger></TabsList></Tabs><Tabs value={range} onValueChange={setRange}><TabsList><TabsTrigger value="7d">7d</TabsTrigger><TabsTrigger value="30d">30d</TabsTrigger><TabsTrigger value="90d">90d</TabsTrigger></TabsList></Tabs></div></div>
        <div className="flex items-center gap-4 px-5 pt-4 text-xs text-muted"><span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-cyan" />{mode === 'rates' ? copy.detail.suppliedApy : copy.detail.suppliedVolume}</span><span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-mint" />{mode === 'rates' ? copy.detail.borrowedApy : copy.detail.borrowedVolume}</span><StatusPill status="neutral" label={`${snapshots.length} ${copy.detail.points}`} /></div>
        <div className="min-h-[380px] px-2 pb-3 pt-2 md:px-5">{error ? <div role="alert" className="mt-8 rounded-card border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{error}</div> : loading ? <Skeleton className="mt-3 h-[360px] w-full" /> : <Suspense fallback={<Skeleton className="mt-3 h-[360px] w-full" />}><TrendChart snapshots={snapshots} mode={mode} /></Suspense>}</div>
        <div className="border-t border-line px-5 py-3 text-[10px] text-muted">{copy.detail.chartFooter}</div>
      </section>
    </div>
  )
}

function DetailMetric({ label, value, icon, tone = 'cyan' }: { label: string; value: string; icon: React.ReactNode; tone?: 'cyan' | 'mint' }) {
  return <div className="rounded-card border border-line bg-surface p-4"><span className="flex items-center justify-between text-xs text-muted"><span>{label}</span><span className={tone === 'mint' ? 'text-mint' : 'text-cyan'}>{icon}</span></span><strong className="mt-5 block font-mono text-2xl font-medium tracking-[-0.06em] text-ink">{value}</strong></div>
}
