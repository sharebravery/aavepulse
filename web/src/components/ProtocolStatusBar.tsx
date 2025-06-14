import { Activity, Database, LockKeyhole } from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import { copy, sourceLabel } from '@/lib/copy'
import { StatusPill } from './StatusPill'

export function ProtocolStatusBar({ demo, lastSyncedAt }: { demo: boolean; lastSyncedAt?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 text-xs text-muted md:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink"><span className="h-1.5 w-1.5 rounded-full bg-mint shadow-[0_0_12px_rgba(78,242,194,0.8)]" />{copy.dashboard.ethereumMainnet}</span>
        <span className="hidden h-4 w-px bg-line sm:block" />
        <span className="inline-flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-cyan" />{demo ? sourceLabel('demo') : sourceLabel('graph')}</span>
        <span className="inline-flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-mint" />Synced {formatDateTime(lastSyncedAt)}</span>
      </div>
      <StatusPill status="neutral" label={copy.auth.readOnly} />
      <LockKeyhole className="sr-only" aria-hidden="true" />
    </div>
  )
}
