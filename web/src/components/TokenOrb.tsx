import { formatTokenSymbol } from '@/lib/design'
import { cn } from '@/lib/utils'

const orbPalettes = ['from-cyan/80 to-blue/80', 'from-blue/90 to-indigo-400/80', 'from-mint/80 to-cyan/80', 'from-amber/90 to-orange-400/80']

function paletteFor(symbol: string): string {
  return orbPalettes[[...symbol].reduce((sum, char) => sum + char.charCodeAt(0), 0) % orbPalettes.length]
}

export function TokenOrb({ symbol, size = 'md' }: { symbol: string; size?: 'sm' | 'md' | 'lg' }) {
  const label = formatTokenSymbol(symbol)
  const sizeClass = { sm: 'h-8 w-8 text-[9px]', md: 'h-10 w-10 text-[10px]', lg: 'h-16 w-16 text-sm' }[size]
  return (
    <span aria-label={`${symbol || 'Token'} token`} className={cn('token-orb relative isolate inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br font-mono font-semibold text-void shadow-[inset_0_1px_1px_rgba(255,255,255,0.55),0_0_24px_rgba(55,215,255,0.12)]', paletteFor(symbol), sizeClass)}>
      <span aria-hidden="true" className="absolute inset-[2px] rounded-full border border-white/25" />
      <span className="relative">{label}</span>
    </span>
  )
}
