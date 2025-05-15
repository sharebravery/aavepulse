import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeTone = 'neutral' | 'blue' | 'cyan' | 'mint' | 'amber' | 'danger'

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'border-line bg-white/[0.04] text-muted',
  blue: 'border-blue/30 bg-blue/10 text-blue',
  cyan: 'border-cyan/30 bg-cyan/10 text-cyan',
  mint: 'border-mint/30 bg-mint/10 text-mint',
  amber: 'border-amber/30 bg-amber/10 text-amber',
  danger: 'border-danger/30 bg-danger/10 text-danger',
}

export function Badge({ tone = 'neutral', className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em]', toneClasses[tone], className)} {...props} />
}

export type { BadgeTone }
