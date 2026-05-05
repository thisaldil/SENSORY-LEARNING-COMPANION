import { cn } from '@/lib/utils'

export function FlowStepper({ steps, currentIndex }) {
  return (
    <nav aria-label="Learn flow progress">
      <ol className="flex flex-wrap items-center gap-1 text-xs sm:text-sm">
        {steps.map((label, i) => (
          <li key={label} className="flex items-center gap-1">
            {i > 0 && (
              <span className="mx-1 text-[var(--muted-foreground)]" aria-hidden>
                /
              </span>
            )}
            <span
              className={cn(
                'rounded-full px-2 py-0.5 font-medium',
                i === currentIndex &&
                  'bg-[var(--primary)]/15 text-[var(--primary)] ring-1 ring-[var(--primary)]/30',
                i < currentIndex && 'text-[var(--success)]',
                i > currentIndex && 'text-[var(--muted-foreground)]',
              )}
            >
              {i + 1}. {label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  )
}
