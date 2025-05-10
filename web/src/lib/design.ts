export type UtilizationTone = 'mint' | 'blue' | 'amber'

export function formatTokenSymbol(symbol: string): string {
  const normalized = symbol.trim().toUpperCase()
  if (!normalized) return 'TOKEN'
  return normalized.slice(0, 4)
}

export function getUtilizationTone(value: number): UtilizationTone {
  if (value < 0.6) return 'mint'
  if (value <= 0.8) return 'blue'
  return 'amber'
}

export function clampRatio(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))
}

export const toneClasses: Record<UtilizationTone, { text: string; fill: string }> = {
  mint: { text: 'text-mint', fill: 'bg-mint' },
  blue: { text: 'text-blue', fill: 'bg-blue' },
  amber: { text: 'text-amber', fill: 'bg-amber' },
}
