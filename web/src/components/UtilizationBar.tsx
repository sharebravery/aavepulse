import { clampRatio, getUtilizationTone, toneClasses } from '@/lib/design'
import { cn } from '@/lib/utils'
import { copy } from '@/lib/copy'

export function UtilizationBar({ value, showValue = false, className }: { value: number | string; showValue?: boolean; className?: string }) {
  const ratio = clampRatio(Number(value))
  const percentage = ratio * 100
  const tone = getUtilizationTone(ratio)
  return (
    <div className={cn('flex min-w-28 items-center gap-2', className)}>
      <div role="progressbar" aria-label={copy.reserves.utilization} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage} className="h-1.5 min-w-12 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
        <div className={cn('h-full rounded-full transition-[width] duration-500', toneClasses[tone].fill)} style={{ width: `${percentage}%` }} />
      </div>
      {showValue ? <span className={cn('font-mono text-xs tabular-nums', toneClasses[tone].text)}>{percentage.toFixed(2)}%</span> : null}
    </div>
  )
}
