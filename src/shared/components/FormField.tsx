import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 block text-sm text-[var(--color-text-muted)]">{children}</span>
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="field" {...props} />
}

export function TextSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="field" {...props} />
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block text-sm">
      <FieldLabel>{label}</FieldLabel>
      {children}
    </label>
  )
}
