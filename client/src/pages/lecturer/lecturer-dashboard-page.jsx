import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Radio, Sparkles, TrendingUp } from 'lucide-react'
import { fetchLessons, fetchMyProgress } from '@/api/content'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { KPIStatCard } from '@/components/ui/kpi-stat-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { EngagementLineChart } from '@/components/charts/engagement-line-chart'

export function LecturerDashboardPage() {
  const lessonsQ = useQuery({ queryKey: ['lessons'], queryFn: fetchLessons })
  const progressQ = useQuery({ queryKey: ['progress-me'], queryFn: fetchMyProgress })

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Lecturer dashboard</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Operational snapshot tied to lessons API + cohort engagement proxies.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" asChild>
            <Link to="/learn" className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4" aria-hidden />
              Learn flow
            </Link>
          </Button>
          <Button asChild>
            <Link to="/lecturer/sessions">
              <Radio className="mr-2 h-4 w-4" />
              Session control
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {lessonsQ.isLoading || progressQ.isLoading ?
          <>
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
          </>
        : <>
            <KPIStatCard
              title="Published lessons"
              value={lessonsQ.data?.length ?? 0}
              mono
              hint="GET /api/lessons"
            />
            <KPIStatCard
              title="Active learners (stub)"
              value={progressQ.data?.quizzes_taken ?? '—'}
              mono
              hint="Reuse progress aggregates"
            />
            <KPIStatCard
              title="Avg engagement"
              value={
                progressQ.data?.avg_quiz_score != null ?
                  `${progressQ.data.avg_quiz_score}%`
                : '—'
              }
              mono
              trend={4}
            />
            <KPIStatCard
              title="Alerts"
              value="0"
              mono
              hint="Wire quiz anomalies later"
            />
          </>
        }
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-[var(--accent)]" />
              Engagement pulse
            </CardTitle>
            <CardDescription>Same series as student view for demo parity.</CardDescription>
          </CardHeader>
          <CardContent>
            {progressQ.isLoading ?
              <Skeleton className="h-[220px]" />
            : (
              <EngagementLineChart data={progressQ.data?.engagement_series ?? []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Course insights</CardTitle>
            <CardDescription>Quick links into management flows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="secondary" className="w-full justify-start" asChild>
              <Link to="/lecturer/courses">Manage lesson outlines</Link>
            </Button>
            <Button variant="secondary" className="w-full justify-start" asChild>
              <Link to="/lecturer/analytics">Open analytics workspace</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
