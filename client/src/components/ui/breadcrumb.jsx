import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function AppBreadcrumb({ items, className }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('text-sm', className)}>
      <ol className="flex flex-wrap items-center gap-1 text-[var(--muted-foreground)]">
        {items.map((item, i) => (
          <li key={item.href ?? item.label} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
            )}
            {item.href && i < items.length - 1 ? (
              <Link
                to={item.href}
                className="hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-[6px] px-1"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={
                  i === items.length - 1
                    ? 'font-medium text-[var(--foreground)]'
                    : ''
                }
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
