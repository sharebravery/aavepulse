import { useEffect, useState } from 'react'
import { Activity, ArrowUpRight, Database, Droplets, Gauge, RefreshCw, TrendingUp } from 'lucide-react'
import { api } from '../lib/client'
import { copy, errorMessage, sourceLabel } from '../lib/copy'
import { formatCurrency, formatDateTime, formatNumber, formatPercent } from '../lib/format'
import type { Overview, Reserve, SyncRun } from '../lib/types'
import { MetricCard } from '../components/MetricCard'
import { PageIntro } from '../components/PageIntro'
import { StatusPill } from '../components/StatusPill'
import { TokenOrb } from '../components/TokenOrb'
import { UtilizationBar } from '../components/UtilizationBar'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'

export function OverviewPage({ onOpenReserve }: { onOpenReserve: (reserve: Reserve) => void }) {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [reserves, setReserves] = useState<Reserve[]>([])
  const [latestRun, setLatestRun] = useState<SyncRun | null>(null)
  const [error, setError] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [notice, setNotice] = useState('')

  const load = async () => {
    setError('')
    try {
      const [overviewData, reserveData, runData] = await Promise.all([api.overview(), api.reserves('?page=1&page_size=6'), api.syncRuns()])
      setOverview(overviewData)
      setReserves(reserveData.data)
      setLatestRun(runData.data[0] || null)
    } catch (cause) {
      setError(errorMessage(cause, copy.common.loadError))
    }
  }

  useEffect(() => { void load() }, [])

  const runSync = async () => {
    setSyncing(true)
    setNotice('')
    try {
      await api.runSync()
      await load()
      setNotice(copy.overview.syncUpdated)
    } catch (cause) {
      setNotice(errorMessage(cause, copy.common.syncFailed))
    } finally {
      setSyncing(false)
    }
  }

  if (error) return <PageState><AlertState message={copy.overview.errorTitle} description={error} /><Button variant="secondary" onClick={() => void load()}>{copy.common.retry}</Button></PageState>
  if (!overview) return <PageState><Skeleton className="h-10 w-48" /><Skeleton className="h-44 w-full" /><Skeleton className="h-80 w-full" /></PageState>

  return (
    <div className="animate-page-in mx-auto max-w-[1480px] px-5 py-6 md:px-8 md:py-9">
      <PageIntro eyebrow={copy.overview.eyebrow} title={copy.overview.title} description={`${copy.overview.lastSynced} ${formatDateTime(overview.last_synced_at)} · ${formatNumber(overview.reserve_count)} ${copy.overview.markets}`} actions={<><StatusPill status={overview.demo ? 'demo' : 'graph'} label={sourceLabel(overview.demo ? 'demo' : 'graph')} /><Button onClick={() => void runSync()} disabled={syncing}><RefreshCw className={syncing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />{syncing ? copy.common.syncing : copy.common.sync}</Button></>} />
      {notice ? <div role="status" className="mb-5 rounded-control border border-cyan/20 bg-cyan/5 px-4 py-3 text-sm text-cyan">{notice}</div> : null}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <MetricCard featured label={copy.overview.totalSupplied} value={formatCurrency(overview.total_supplied_usd)} detail={copy.overview.totalSuppliedDetail} icon={<Droplets className="h-4 w-4" />} tone="cyan" />
        <MetricCard label={copy.overview.totalBorrowed} value={formatCurrency(overview.total_borrowed_usd)} detail={copy.overview.totalBorrowedDetail} icon={<TrendingUp className="h-4 w-4" />} tone="blue" />
        <MetricCard label={copy.overview.available} value={formatCurrency(overview.available_liquidity_usd)} detail={copy.overview.availableDetail} icon={<Database className="h-4 w-4" />} tone="mint" />
        <MetricCard label={copy.overview.utilization} value={formatPercent(overview.utilization_rate)} detail={copy.overview.utilizationDetail} icon={<Gauge className="h-4 w-4" />} tone="amber" />
      </section>

      <section className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.7fr)]">
        <article className="panel-sheen overflow-hidden rounded-panel border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-5 py-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan">{copy.overview.marketMap}</p><h2 className="mt-1 text-lg font-medium tracking-[-0.03em]">{copy.overview.coreMarkets}</h2></div><Database className="h-5 w-5 text-muted" /></div>
          <div className="divide-y divide-line">
            {reserves.map((reserve) => <button type="button" key={reserve.id} onClick={() => onOpenReserve(reserve)} className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.04] md:grid-cols-[auto_minmax(120px,1fr)_minmax(180px,0.7fr)_auto]">
              <TokenOrb symbol={reserve.symbol} size="sm" />
              <span className="min-w-0"><span className="block font-mono text-sm font-medium text-ink">{reserve.symbol}</span><span className="block truncate text-xs text-muted">{reserve.name}</span></span>
              <span className="hidden md:block"><span className="block font-mono text-sm tabular-nums text-ink">{formatCurrency(reserve.total_supplied_usd)}</span><span className="mt-1 block text-[10px] uppercase tracking-[0.1em] text-muted">{copy.overview.supplied}</span></span>
              <span className="flex items-center gap-3"><UtilizationBar value={reserve.utilization_rate} showValue /><ArrowUpRight className="h-4 w-4 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan" /></span>
            </button>)}
          </div>
        </article>

        <article className="rounded-panel border border-line bg-surface p-5">
          <div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mint">{copy.overview.dataPipeline}</p><h2 className="mt-1 text-lg font-medium tracking-[-0.03em]">{copy.overview.syncSignal}</h2></div><Activity className="h-5 w-5 text-mint" /></div>
          <div className="my-10 flex flex-col items-center text-center"><div className="relative grid h-24 w-24 place-items-center rounded-full border border-mint/20 bg-mint/[0.04]"><span className="absolute inset-2 rounded-full border border-dashed border-mint/35" /><span className="h-8 w-8 rounded-full bg-mint/80 shadow-[0_0_28px_rgba(78,242,194,0.55)] animate-pulse-ring" /></div><strong className="mt-5 font-mono text-sm text-ink">{latestRun?.status === 'succeeded' ? copy.overview.pipelineHealthy : copy.overview.waitingForSync}</strong><span className="mt-2 text-xs text-muted">{latestRun ? `${sourceLabel(latestRun.source)} · ${formatNumber(latestRun.written_count)} ${copy.overview.writtenMarkets}` : copy.overview.runFirstSync}</span></div>
          <dl className="divide-y divide-line border-y border-line text-xs"><div className="flex justify-between py-3"><dt className="text-muted">{copy.overview.latestRun}</dt><dd className="font-mono text-ink">{formatDateTime(latestRun?.started_at)}</dd></div><div className="flex justify-between py-3"><dt className="text-muted">{copy.overview.dataSource}</dt><dd className="font-mono text-cyan">{latestRun ? sourceLabel(latestRun.source) : copy.common.notAvailable}</dd></div></dl>
        </article>
      </section>
    </div>
  )
}

function AlertState({ message, description }: { message: string; description: string }) {
  return <div role="alert" className="rounded-card border border-danger/30 bg-danger/10 p-4"><strong className="block text-sm text-danger">{message}</strong><span className="mt-1 block text-xs text-danger/80">{description}</span></div>
}

function PageState({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex min-h-[70vh] max-w-[720px] flex-col justify-center gap-4 px-5 py-10 md:px-8">{children}</div>
}
