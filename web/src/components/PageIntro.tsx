import type { ReactNode } from 'react'

export function PageIntro({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return (
    <header className="mb-7 flex flex-col justify-between gap-5 border-b border-line pb-6 md:flex-row md:items-end">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-medium tracking-[-0.05em] text-ink md:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted">{description}</p>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  )
}
