import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[12px] border border-dashed border-[var(--border)] bg-[var(--surface-subtle)]/30 px-8 py-16 text-center',
        className,
      )}
    >
      {Icon && (
        <Icon
          className="mb-4 h-10 w-10 text-[var(--muted-foreground)]"
          aria-hidden
        />
      )}
      <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-[var(--muted-foreground)]">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
