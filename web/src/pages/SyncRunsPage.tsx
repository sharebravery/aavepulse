import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Clock3, Database, RefreshCw, Timer } from 'lucide-react'
import { api } from '../lib/client'
import { formatDateTime } from '../lib/format'
import type { SyncRun } from '../lib/types'
import { PageIntro } from '../components/PageIntro'
import { StatusPill } from '../components/StatusPill'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip'

export function SyncRunsPage() {
  const [items, setItems] = useState<SyncRun[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = async () => {
    setLoading(true)
    try { setItems((await api.syncRuns()).data); setError('') } catch (cause) { setError(cause instanceof Error ? cause.message : '同步记录加载失败') } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  const run = async () => {
    setSyncing(true)
    setNotice('')
    try { await api.runSync(); await load(); setNotice('同步完成，新的运行记录已写入') } catch (cause) { setNotice(cause instanceof Error ? cause.message : '同步失败') } finally { setSyncing(false) }
  }

  const latest = items[0]
  return (
    <div className="animate-page-in mx-auto max-w-[1480px] px-5 py-6 md:px-8 md:py-9">
      <PageIntro eyebrow="Data pipeline" title="同步记录" description="每个批次都有来源、耗时、写入量和错误摘要。" actions={<Button onClick={() => void run()} disabled={syncing}><RefreshCw className={syncing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />{syncing ? '同步中' : '执行同步'}</Button>} />
      <section className="mb-5 grid gap-3 sm:grid-cols-3"><Summary icon={<Database />} label="Latest source" value={latest?.source.toUpperCase() || 'N/A'} detail="数据来源" /><Summary icon={<CheckCircle2 />} label="Last status" value={latest?.status.toUpperCase() || 'IDLE'} detail="最近状态" tone={latest?.status === 'succeeded' ? 'mint' : 'blue'} /><Summary icon={<Timer />} label="Written" value={String(latest?.written_count ?? 0)} detail="最近写入市场数" tone="cyan" /></section>
      {notice ? <div role="status" className="mb-5 rounded-control border border-cyan/20 bg-cyan/5 px-4 py-3 text-sm text-cyan">{notice}</div> : null}
      {error ? <div role="alert" className="mb-5 rounded-card border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{error}</div> : null}
      <section className="rounded-panel border border-line bg-surface p-5 md:p-6"><div className="mb-6 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan">Execution history</p><h2 className="mt-1 text-lg font-medium">Pipeline runs</h2></div><Clock3 className="h-5 w-5 text-muted" /></div>{loading ? <div className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div> : items.length === 0 ? <div className="py-12 text-center text-sm text-muted">还没有同步记录</div> : <div className="relative space-y-3 before:absolute before:bottom-5 before:left-[15px] before:top-5 before:w-px before:bg-line">{items.map((item) => <RunItem key={item.id} item={item} />)}</div>}</section>
    </div>
  )
}

function RunItem({ item }: { item: SyncRun }) {
  const status = item.status === 'succeeded' ? 'success' : item.status === 'failed' ? 'error' : 'running'
  const Icon = item.status === 'succeeded' ? CheckCircle2 : item.status === 'failed' ? AlertCircle : RefreshCw
  return <article className="relative grid gap-4 rounded-card border border-line bg-white/[0.025] p-4 pl-12 transition-colors hover:border-line-active md:grid-cols-[minmax(180px,1fr)_auto_auto_auto] md:items-center"><span className="absolute left-2.5 top-5 grid h-7 w-7 place-items-center rounded-full border border-line bg-surface text-muted"><Icon className={`h-3.5 w-3.5 ${item.status === 'succeeded' ? 'text-mint' : item.status === 'failed' ? 'text-danger' : 'animate-spin text-blue'}`} /></span><div><div className="flex flex-wrap items-center gap-2"><StatusPill status={status} label={item.status} /><StatusPill status={item.source === 'graph' ? 'graph' : 'demo'} label={item.source} /></div><p className="mt-2 font-mono text-xs text-ink">{formatDateTime(item.started_at)}</p></div><RunStat label="读取" value={item.read_count} /><RunStat label="写入" value={item.written_count} /><TooltipProvider><Tooltip><TooltipTrigger asChild><span className="max-w-[220px] truncate text-xs text-muted md:text-right">{item.error_summary || '无错误摘要'}</span></TooltipTrigger><TooltipContent>{item.error_summary || '无错误摘要'}</TooltipContent></Tooltip></TooltipProvider></article>
}

function RunStat({ label, value }: { label: string; value: number }) { return <div className="flex items-center justify-between gap-3 text-xs md:block md:text-right"><span className="text-muted">{label}</span><strong className="font-mono text-ink">{value}</strong></div> }

function Summary({ icon, label, value, detail, tone = 'blue' }: { icon: React.ReactNode; label: string; value: string; detail: string; tone?: 'blue' | 'mint' | 'cyan' }) {
  const toneClass = { blue: 'bg-blue/10 text-blue', mint: 'bg-mint/10 text-mint', cyan: 'bg-cyan/10 text-cyan' }[tone]
  return <div className="rounded-card border border-line bg-surface p-4"><span className={`grid h-8 w-8 place-items-center rounded-lg ${toneClass}`}>{icon}</span><p className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{label}</p><strong className="mt-1 block font-mono text-xl font-medium text-ink">{value}</strong><span className="mt-1 block text-xs text-muted">{detail}</span></div>
}
