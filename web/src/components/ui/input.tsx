import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-control border border-line bg-surface/80 px-3 text-sm text-ink outline-none placeholder:text-muted/65 transition-colors focus:border-cyan/60 focus:ring-4 focus:ring-cyan/10',
        className,
      )}
      {...props}
    />
  )
}
