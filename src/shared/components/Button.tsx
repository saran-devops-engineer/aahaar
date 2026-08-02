import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
  loading?: boolean
}

const styles: Record<Variant, string> = {
  primary:
    'bg-[var(--color-accent)] text-[#0b1f17] hover:bg-[var(--color-accent-strong)]',
  secondary:
    'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-accent)]',
  ghost: 'bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center rounded-2xl px-5 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {children}
    </button>
  )
}
