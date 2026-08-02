interface ChipOption {
  id: string
  label: string
  description?: string
}

interface ChipGroupProps {
  options: ChipOption[]
  selected: string[]
  onChange: (next: string[]) => void
  multi?: boolean
}

export function ChipGroup({
  options,
  selected,
  onChange,
  multi = true,
}: ChipGroupProps) {
  function toggle(id: string) {
    if (multi) {
      onChange(
        selected.includes(id)
          ? selected.filter((item) => item !== id)
          : [...selected, id],
      )
      return
    }
    onChange(selected.includes(id) ? [] : [id])
  }

  return (
    <ul className="space-y-2">
      {options.map((option) => {
        const active = selected.includes(option.id)
        return (
          <li key={option.id}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option.id)}
              className={`flex w-full min-h-12 items-start rounded-2xl border px-4 py-3 text-left transition ${
                active
                  ? 'border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_16%,transparent)]'
                  : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-accent)]'
              }`}
            >
              <span className="flex-1">
                <span className="block font-semibold">{option.label}</span>
                {option.description ? (
                  <span className="mt-0.5 block text-sm text-[var(--color-text-muted)]">
                    {option.description}
                  </span>
                ) : null}
              </span>
              <span
                className={`mt-1 ml-3 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  active
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[#0b1f17]'
                    : 'border-[var(--color-border)]'
                }`}
                aria-hidden
              >
                {active ? '✓' : ''}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
