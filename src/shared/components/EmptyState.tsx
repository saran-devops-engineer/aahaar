import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-5 py-8 text-center animate-fade-up"
      role="status"
    >
      <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--color-text-muted)]">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  )
}
