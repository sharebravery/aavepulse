export function formatCurrency(value: string | number): string {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '$0.00'

  const units = [
    { threshold: 1_000_000_000, suffix: 'B' },
    { threshold: 1_000_000, suffix: 'M' },
    { threshold: 1_000, suffix: 'K' },
  ]
  const unit = units.find((item) => Math.abs(amount) >= item.threshold)
  if (unit) return `$${(amount / unit.threshold).toFixed(2)}${unit.suffix}`
  return `$${amount.toFixed(2)}`
}

export function formatPercent(value: string | number): string {
  const ratio = Number(value)
  if (!Number.isFinite(ratio)) return '0.00%'
  return `${(ratio * 100).toFixed(2)}%`
}

export function formatDateTime(value?: string): string {
  if (!value) return '尚未同步'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '未知时间'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}
