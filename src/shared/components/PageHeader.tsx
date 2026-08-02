interface PageHeaderProps {
  title: string
  subtitle?: string
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="mb-6 animate-fade-up">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 max-w-xl text-base text-[var(--color-text-muted)]">{subtitle}</p>
      ) : null}
    </header>
  )
}
