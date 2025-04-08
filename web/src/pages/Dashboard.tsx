import { startTransition, useState } from 'react'
import { Button } from 'antd'
import { Activity, Database, Gauge, LogOut, RefreshCw } from 'lucide-react'
import type { Reserve } from '../lib/types'
import { OverviewPage } from './OverviewPage'
import { ReservesPage } from './ReservesPage'
import { ReserveDetailPage } from './ReserveDetailPage'
import { SyncRunsPage } from './SyncRunsPage'

type View = 'overview' | 'reserves' | 'sync'

export function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [view, setView] = useState<View>('overview')
  const [selectedReserve, setSelectedReserve] = useState<Reserve | null>(null)

  const navigate = (next: View) => {
    startTransition(() => {
      setSelectedReserve(null)
      setView(next)
    })
  }

  const nav = [
    { id: 'overview' as const, label: '协议概览', index: '01', icon: Gauge },
    { id: 'reserves' as const, label: '储备市场', index: '02', icon: Database },
    { id: 'sync' as const, label: '同步记录', index: '03', icon: RefreshCw },
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <span className="brand-mark">AP</span>
          <span>AavePulse</span>
        </div>
        <div className="network-pill"><span /> ETHEREUM MAINNET</div>
        <nav aria-label="主要导航">
          {nav.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                className={view === item.id && !selectedReserve ? 'nav-item active' : 'nav-item'}
                onClick={() => navigate(item.id)}
              >
                <span className="nav-index">{item.index}</span>
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}
        </nav>
        <div className="sidebar-foot">
          <Activity size={16} />
          <span>READ ONLY</span>
          <Button type="text" icon={<LogOut size={16} />} onClick={onLogout} aria-label="退出登录" />
        </div>
      </aside>

      <section className="workspace">
        {selectedReserve ? (
          <ReserveDetailPage reserve={selectedReserve} onBack={() => setSelectedReserve(null)} />
        ) : null}
        {!selectedReserve && view === 'overview' ? <OverviewPage onOpenReserve={setSelectedReserve} /> : null}
        {!selectedReserve && view === 'reserves' ? <ReservesPage onOpenReserve={setSelectedReserve} /> : null}
        {!selectedReserve && view === 'sync' ? <SyncRunsPage /> : null}
      </section>
    </div>
  )
}
