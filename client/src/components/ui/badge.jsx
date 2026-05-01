import * as React from 'react'
import { cn } from '@/lib/utils'

const Badge = React.forwardRef(({ className, variant = 'default', ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
      variant === 'default' &&
        'border-transparent bg-[var(--primary)]/10 text-[var(--primary)]',
      variant === 'secondary' &&
        'border-transparent bg-[var(--surface-subtle)] text-[var(--muted-foreground)]',
      variant === 'outline' && 'border-[var(--border)] text-[var(--foreground)]',
      className,
    )}
    {...props}
  />
))
Badge.displayName = 'Badge'

export { Badge }
