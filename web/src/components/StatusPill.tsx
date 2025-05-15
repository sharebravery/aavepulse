import { cn } from '@/lib/utils'
import { Badge, type BadgeTone } from './ui/badge'

type StatusTone = 'demo' | 'graph' | 'success' | 'running' | 'warning' | 'error' | 'neutral'

const statusMap: Record<StatusTone, { tone: BadgeTone; dot: string }> = {
  demo: { tone: 'amber', dot: 'bg-amber' },
  graph: { tone: 'cyan', dot: 'bg-cyan' },
  success: { tone: 'mint', dot: 'bg-mint' },
  running: { tone: 'blue', dot: 'bg-blue animate-pulse' },
  warning: { tone: 'amber', dot: 'bg-amber' },
  error: { tone: 'danger', dot: 'bg-danger' },
  neutral: { tone: 'neutral', dot: 'bg-muted' },
}

export function StatusPill({ label, status = 'neutral' }: { label: string; status?: StatusTone }) {
  const config = statusMap[status]
  return <Badge tone={config.tone}><span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />{label}</Badge>
}
