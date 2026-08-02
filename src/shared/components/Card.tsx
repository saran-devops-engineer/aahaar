import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

/** Interaction / content container — used outside hero for actionable blocks. */
export function Card({ children, className = '' }: CardProps) {
  return (
    <section
      className={`rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 ${className}`}
    >
      {children}
    </section>
  )
}
