import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function MetricCard({ label, value, detail, icon, tone = 'blue', featured = false }: { label: string; value: string; detail: string; icon: ReactNode; tone?: 'blue' | 'cyan' | 'mint' | 'amber'; featured?: boolean }) {
  const toneText = { blue: 'text-blue', cyan: 'text-cyan', mint: 'text-mint', amber: 'text-amber' }[tone]
  return (
    <article className={cn('panel-sheen rounded-card border border-line bg-surface p-5 transition-colors hover:border-line-active', featured && 'bg-gradient-to-br from-blue/[0.14] via-surface to-surface md:col-span-2')}>
      <div className="relative flex items-start justify-between gap-4">
        <span className={cn('font-mono text-[10px] uppercase tracking-[0.16em]', toneText)}>{label}</span>
        <span className={cn('grid h-8 w-8 place-items-center rounded-lg bg-white/[0.05]', toneText)}>{icon}</span>
      </div>
      <strong className="relative mt-8 block font-mono text-2xl font-medium tracking-[-0.06em] text-ink md:text-3xl">{value}</strong>
      <span className="relative mt-1 block text-xs text-muted">{detail}</span>
    </article>
  )
}
