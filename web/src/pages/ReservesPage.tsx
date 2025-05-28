import { useDeferredValue, useEffect, useState } from 'react'
import { ArrowUpRight, Search, SlidersHorizontal } from 'lucide-react'
import { api } from '../lib/client'
import { formatCurrency, formatPercent } from '../lib/format'
import type { Reserve } from '../lib/types'
import { PageIntro } from '../components/PageIntro'
import { TokenOrb } from '../components/TokenOrb'
import { UtilizationBar } from '../components/UtilizationBar'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Skeleton } from '../components/ui/skeleton'
import { StatusPill } from '../components/StatusPill'

export function ReservesPage({ onOpenReserve }: { onOpenReserve: (reserve: Reserve) => void }) {
  const [items, setItems] = useState<Reserve[]>([])
  const [search, setSearch] = useState('')
  const [orderBy, setOrderBy] = useState('total_supplied_usd')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    const query = new URLSearchParams({ page: '1', page_size: '100', order_by: orderBy, order: 'desc' })
    if (deferredSearch) query.set('symbol', deferredSearch)
    setLoading(true)
    api.reserves(`?${query}`).then((result) => { setItems(result.data); setError('') }).catch((cause) => setError(cause instanceof Error ? cause.message : '市场数据加载失败')).finally(() => setLoading(false))
  }, [deferredSearch, orderBy])

  return (
    <div className="animate-page-in mx-auto max-w-[1480px] px-5 py-6 md:px-8 md:py-9">
      <PageIntro eyebrow="Reserve directory" title="储备市场" description="比较流动性、资金效率和借贷成本。" actions={<StatusPill status="neutral" label={`${items.length} markets`} />} />
      <div className="mb-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]"><label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><Input className="pl-10" placeholder="搜索资产符号" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="搜索资产符号" /></label><div className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-muted" /><Select value={orderBy} onValueChange={setOrderBy}><SelectTrigger aria-label="排序方式"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="total_supplied_usd">按供应量排序</SelectItem><SelectItem value="total_borrowed_usd">按借款量排序</SelectItem><SelectItem value="utilization_rate">按利用率排序</SelectItem><SelectItem value="supply_apy">按供应 APY 排序</SelectItem></SelectContent></Select></div></div>
      {error ? <div role="alert" className="mb-5 rounded-card border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{error}</div> : null}
      <section className="overflow-hidden rounded-panel border border-line bg-surface">
        <div className="hidden grid-cols-[minmax(200px,1.5fr)_repeat(6,minmax(100px,1fr))_32px] gap-4 border-b border-line bg-white/[0.025] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted lg:grid"><span>Asset</span><span className="text-right">Supplied</span><span className="text-right">Borrowed</span><span className="text-right">Available</span><span className="text-right">Utilization</span><span className="text-right">Supply APY</span><span className="text-right">Borrow APY</span><span /></div>
        {loading ? <div className="space-y-3 p-5"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div> : items.length === 0 ? <div className="p-12 text-center text-sm text-muted">没有匹配的储备市场</div> : <div className="divide-y divide-line">{items.map((reserve) => <ReserveRow key={reserve.id} reserve={reserve} onOpen={() => onOpenReserve(reserve)} />)}</div>}
      </section>
    </div>
  )
}

function ReserveRow({ reserve, onOpen }: { reserve: Reserve; onOpen: () => void }) {
  return <button type="button" onClick={onOpen} className="group grid w-full gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.04] lg:grid-cols-[minmax(200px,1.5fr)_repeat(6,minmax(100px,1fr))_32px] lg:items-center lg:gap-4">
    <span className="flex min-w-0 items-center gap-3"><TokenOrb symbol={reserve.symbol} size="md" /><span className="min-w-0"><span className="block font-mono text-sm font-medium text-ink">{reserve.symbol}</span><span className="block truncate text-xs text-muted">{reserve.name}</span></span></span>
    <DataCell label="供应量" value={formatCurrency(reserve.total_supplied_usd)} /><DataCell label="借款量" value={formatCurrency(reserve.total_borrowed_usd)} /><DataCell label="可用流动性" value={formatCurrency(reserve.available_liquidity_usd)} />
    <span className="flex items-center justify-between gap-3 lg:block"><span className="text-xs text-muted lg:hidden">利用率</span><UtilizationBar value={reserve.utilization_rate} showValue /></span>
    <DataCell label="供应 APY" value={formatPercent(reserve.supply_apy)} accent="cyan" /><DataCell label="借款 APY" value={formatPercent(reserve.variable_borrow_apy)} accent="mint" />
    <ArrowUpRight className="hidden h-4 w-4 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan lg:block" />
  </button>
}

function DataCell({ label, value, accent = 'default' }: { label: string; value: string; accent?: 'default' | 'cyan' | 'mint' }) {
  return <span className="flex items-center justify-between lg:block lg:text-right"><span className="text-xs text-muted lg:hidden">{label}</span><span className={`font-mono text-sm tabular-nums ${accent === 'cyan' ? 'text-cyan' : accent === 'mint' ? 'text-mint' : 'text-ink'}`}>{value}</span></span>
}
