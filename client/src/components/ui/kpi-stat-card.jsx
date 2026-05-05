import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function KPIStatCard({
  title,
  value,
  hint,
  trend,
  className,
  mono,
}) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <p className="text-sm font-medium text-[var(--muted-foreground)]">
          {title}
        </p>
      </CardHeader>
      <CardContent className="space-y-1">
        <p
          className={cn(
            'text-3xl font-semibold tracking-tight text-[var(--foreground)]',
            mono && 'font-mono tabular-nums',
          )}
        >
          {value}
        </p>
        {hint && (
          <p className="text-xs text-[var(--muted-foreground)]">{hint}</p>
        )}
        {trend != null && (
          <p
            className={cn(
              'text-xs font-medium',
              trend >= 0 ? 'text-[var(--success)]' : 'text-[var(--destructive)]',
            )}
          >
            {trend >= 0 ? '+' : ''}
            {trend}% vs last week
          </p>
        )}
      </CardContent>
    </Card>
  )
}
