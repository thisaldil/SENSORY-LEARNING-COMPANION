import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Sparkles } from 'lucide-react'
import { fetchLessons, fetchMyProgress, fetchQuizResults } from '@/api/content'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { KPIStatCard } from '@/components/ui/kpi-stat-card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { EngagementLineChart } from '@/components/charts/engagement-line-chart'

export function StudentDashboardPage() {
  const navigate = useNavigate()
  const lessonsQ = useQuery({
    queryKey: ['lessons'],
    queryFn: fetchLessons,
  })
  const progressQ = useQuery({
    queryKey: ['progress-me'],
    queryFn: fetchMyProgress,
  })
  const quizzesQ = useQuery({
    queryKey: ['quiz-results'],
    queryFn: fetchQuizResults,
  })

  const lessons = lessonsQ.data ?? []
  const progress = progressQ.data ?? {}
  const quizAvg =
    quizzesQ.data?.length ?
      Math.round(
        quizzesQ.data.reduce((acc, q) => acc + (q.score ?? 0), 0) /
          quizzesQ.data.length,
      )
    : null

  const hasErr = lessonsQ.isError || progressQ.isError || quizzesQ.isError

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Student dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          KPIs from `/api/progress/me`, lessons from `/api/lessons`, quiz history from `/api/quizzes/results`.
        </p>
        <div className="mt-4">
          <Button asChild>
            <Link to="/learn" className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4" aria-hidden />
              Start Learn flow
            </Link>
          </Button>
        </div>
      </div>

      {hasErr && (
        <div className="rounded-[12px] border border-[var(--destructive)]/40 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">
          Some data failed to load. Check API URL, CORS, and credentials (refresh cookie).
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {progressQ.isLoading ?
          <>
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
          </>
        : <>
            <KPIStatCard
              title="Lessons completed"
              value={progress.lessons_completed ?? '—'}
              mono
              hint="From progress aggregate"
            />
            <KPIStatCard
              title="Quizzes taken"
              value={progress.quizzes_taken ?? '—'}
              mono
            />
            <KPIStatCard
              title="Avg quiz score"
              value={
                progress.avg_quiz_score != null ?
                  `${progress.avg_quiz_score}%`
                : quizAvg != null ? `${quizAvg}%` : '—'
              }
              mono
            />
            <KPIStatCard
              title="Streak"
              value={`${progress.streak_days ?? 0}d`}
              hint="Engagement consistency"
              mono
            />
          </>
        }
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-[var(--border)] shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-lg">Engagement trend</CardTitle>
            <CardDescription>Seven-day signal (mock-friendly).</CardDescription>
          </CardHeader>
          <CardContent>
            {progressQ.isLoading ?
              <Skeleton className="h-[220px] w-full" />
            : progressQ.isError ?
              <p className="text-sm text-[var(--muted-foreground)]">Could not load chart.</p>
            : (
              <EngagementLineChart data={progress.engagement_series ?? []} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-[var(--border)] shadow-[var(--shadow-card)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg">Recent courses</CardTitle>
              <CardDescription>Latest lessons from the API.</CardDescription>
            </div>
            <Button variant="secondary" size="sm" asChild>
              <Link to="/student/courses">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {lessonsQ.isLoading ?
              <>
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </>
            : lessonsQ.isError ?
              <EmptyState
                icon={BookOpen}
                title="Lessons unavailable"
                description="Verify GET /api/lessons returns an array or wrapped list."
              />
            : lessons.length === 0 ?
              <EmptyState
                icon={BookOpen}
                title="No lessons yet"
                description="Create a lesson via POST /api/lessons or switch to mock mode."
                actionLabel="Browse courses"
                onAction={() => navigate('/student/courses')}
              />
            : lessons.slice(0, 4).map((l) => (
                <Link
                  key={l.id ?? l.lesson_id}
                  to={`/student/courses/${l.id ?? l.lesson_id}`}
                  className="block rounded-[10px] border border-[var(--border)] bg-[var(--surface-subtle)]/40 px-3 py-3 text-sm transition-colors hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                >
                  <p className="font-medium text-[var(--foreground)]">{l.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-[var(--muted-foreground)]">
                    {l.description ?? 'Open lesson detail for tabs and activities.'}
                  </p>
                </Link>
              ))
            }
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
