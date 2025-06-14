import { startTransition, useEffect, useState } from 'react'
import { Activity, BarChart3, Database, Gauge, LogOut, RefreshCw } from 'lucide-react'
import { api } from '../lib/client'
import { copy } from '../lib/copy'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '../components/ui/dialog'
import { ProtocolStatusBar } from '../components/ProtocolStatusBar'
import type { Reserve } from '../lib/types'
import { OverviewPage } from './OverviewPage'
import { ReservesPage } from './ReservesPage'
import { ReserveDetailPage } from './ReserveDetailPage'
import { SyncRunsPage } from './SyncRunsPage'

type View = 'overview' | 'reserves' | 'sync'

const nav = [
  { id: 'overview' as const, label: copy.dashboard.overview, hint: copy.dashboard.overviewHint, icon: Gauge },
  { id: 'reserves' as const, label: copy.dashboard.reserves, hint: copy.dashboard.reservesHint, icon: Database },
  { id: 'sync' as const, label: copy.dashboard.syncRuns, hint: copy.dashboard.syncRunsHint, icon: RefreshCw },
]

export function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [view, setView] = useState<View>('overview')
  const [selectedReserve, setSelectedReserve] = useState<Reserve | null>(null)
  const [demo, setDemo] = useState(true)
  const [lastSyncedAt, setLastSyncedAt] = useState<string>()

  useEffect(() => {
    api.overview().then((overview) => {
      setDemo(overview.demo)
      setLastSyncedAt(overview.last_synced_at)
    }).catch(() => undefined)
  }, [])

  const navigate = (next: View) => {
    startTransition(() => {
      setSelectedReserve(null)
      setView(next)
    })
  }

  const activeView = selectedReserve ? null : view
  const navigation = (
    <nav aria-label={copy.dashboard.navigation} className="grid gap-1.5">
      {nav.map((item) => {
        const Icon = item.icon
        const active = activeView === item.id
        return (
          <button key={item.id} type="button" onClick={() => navigate(item.id)} className={`group flex w-full items-center gap-3 rounded-control border px-3 py-3 text-left transition-colors ${active ? 'border-blue/35 bg-blue/12 text-ink' : 'border-transparent text-muted hover:border-line hover:bg-white/[0.04] hover:text-ink'}`}>
            <span className={`grid h-8 w-8 place-items-center rounded-lg ${active ? 'bg-blue/20 text-blue' : 'bg-white/[0.04] text-muted group-hover:text-cyan'}`}><Icon className="h-4 w-4" /></span>
            <span className="min-w-0"><span className="block text-sm font-medium">{item.label}</span><span className="block truncate text-[10px] text-muted">{item.hint}</span></span>
            {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_10px_rgba(55,215,255,0.8)]" /> : null}
          </button>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-screen bg-void text-ink">
      <aside className="fixed inset-y-4 left-4 z-20 hidden w-[248px] flex-col rounded-panel border border-line bg-surface/90 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl md:flex">
        <Brand />
        <div className="mt-8 rounded-control border border-line bg-white/[0.03] p-3"><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink"><span className="h-1.5 w-1.5 rounded-full bg-mint shadow-[0_0_12px_rgba(78,242,194,0.8)]" />{copy.dashboard.ethereumMainnet}</div><p className="mt-2 pl-3.5 text-[10px] text-muted">{copy.dashboard.protocolNetwork}</p></div>
        <div className="mt-6">{navigation}</div>
        <div className="mt-auto border-t border-line pt-4"><div className="flex items-center gap-2 text-xs text-muted"><Activity className="h-4 w-4 text-mint" /><span>{copy.dashboard.indexHealthy}</span><span className="ml-auto font-mono text-[10px] text-mint">{copy.dashboard.live}</span></div><Button variant="ghost" size="sm" className="mt-3 w-full justify-start" onClick={onLogout}><LogOut className="h-4 w-4" />{copy.dashboard.signOut}</Button></div>
      </aside>

      <main className="min-h-screen md:pl-[280px]">
        <ProtocolStatusBar demo={demo} lastSyncedAt={lastSyncedAt} />
        <div className="terminal-grid min-h-[calc(100vh-49px)] pb-24 md:pb-10">
          {selectedReserve ? <ReserveDetailPage reserve={selectedReserve} onBack={() => setSelectedReserve(null)} /> : null}
          {!selectedReserve && view === 'overview' ? <OverviewPage onOpenReserve={setSelectedReserve} /> : null}
          {!selectedReserve && view === 'reserves' ? <ReservesPage onOpenReserve={setSelectedReserve} /> : null}
          {!selectedReserve && view === 'sync' ? <SyncRunsPage /> : null}
        </div>
      </main>

      <div className="fixed inset-x-3 bottom-3 z-30 md:hidden">
        <div className="flex items-center justify-around rounded-panel border border-line bg-surface/90 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
          {nav.map((item) => { const Icon = item.icon; const active = activeView === item.id; return <button key={item.id} type="button" aria-label={item.label} onClick={() => navigate(item.id)} className={`grid h-11 min-w-16 place-items-center rounded-control ${active ? 'bg-blue/20 text-cyan' : 'text-muted'}`}><Icon className="h-4 w-4" /><span className="mt-0.5 text-[9px]">{item.label}</span></button> })}
          <Dialog><DialogTrigger asChild><button type="button" aria-label={copy.dashboard.openAccount} className="grid h-11 min-w-16 place-items-center rounded-control text-muted"><BarChart3 className="h-4 w-4" /><span className="mt-0.5 text-[9px]">{copy.dashboard.account}</span></button></DialogTrigger><DialogContent><Brand /><div className="mt-8 space-y-3"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{copy.dashboard.session}</p><div className="rounded-card border border-line bg-white/[0.03] p-4"><p className="text-sm text-ink">{copy.dashboard.readOnlyOperator}</p><p className="mt-1 font-mono text-xs text-muted">{copy.dashboard.localDemo}</p></div><Button variant="danger" className="w-full" onClick={onLogout}><LogOut className="h-4 w-4" />{copy.dashboard.signOut}</Button></div></DialogContent></Dialog>
        </div>
      </div>
    </div>
  )
}

function Brand() {
  return <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan/30 bg-gradient-to-br from-blue to-cyan font-mono text-xs font-semibold text-void shadow-[0_0_22px_rgba(55,215,255,0.18)]">AP</span><span><span className="block font-mono text-sm font-semibold tracking-[-0.04em] text-ink">AavePulse</span><span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-muted">{copy.dashboard.defiIntelligence}</span></span></div>
}
