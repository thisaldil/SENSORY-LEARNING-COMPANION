import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchMyProgress } from '@/api/content'
import { KPIStatCard } from '@/components/ui/kpi-stat-card'
import { Skeleton } from '@/components/ui/skeleton'
import { EngagementLineChart } from '@/components/charts/engagement-line-chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function ProgressHubPage() {
  const q = useQuery({ queryKey: ['progress-me'], queryFn: fetchMyProgress })
  const p = q.data ?? {}

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            GET /api/progress/me — same aggregates used on dashboards.
          </p>
        </div>
        <Button variant="secondary" asChild>
          <Link to="/learn">Continue Learn flow</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {q.isLoading ?
          <>
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
          </>
        : <>
            <KPIStatCard title="Lessons completed" value={p.lessons_completed ?? '—'} mono />
            <KPIStatCard title="Quizzes taken" value={p.quizzes_taken ?? '—'} mono />
            <KPIStatCard
              title="Avg quiz score"
              value={p.avg_quiz_score != null ? `${p.avg_quiz_score}%` : '—'}
              mono
            />
            <KPIStatCard title="Streak" value={`${p.streak_days ?? 0}d`} mono />
          </>
        }
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Engagement</CardTitle>
          <CardDescription>Seven-day engagement_series when backend provides it.</CardDescription>
        </CardHeader>
        <CardContent>
          {q.isLoading ?
            <Skeleton className="h-[220px]" />
          : (
            <EngagementLineChart data={p.engagement_series ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
