import { useQuery } from '@tanstack/react-query'
import { fetchQuizResults } from '@/api/content'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ComparisonBarChart } from '@/components/charts/comparison-bar-chart'
import { DistributionDonutChart } from '@/components/charts/distribution-donut-chart'
import { DataTable } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'

const donut = [
  { name: 'Visual', value: 42 },
  { name: 'Auditory', value: 28 },
  { name: 'Haptic', value: 18 },
  { name: 'Mixed', value: 12 },
]

export function LecturerAnalyticsPage() {
  const q = useQuery({ queryKey: ['quiz-results'], queryFn: fetchQuizResults })
  const quizzes = q.data ?? []

  const barData = quizzes.map((r, i) => ({
    label: `Q${i + 1}`,
    score: r.score ?? r.percent ?? 0,
  }))

  const columns = [
    { key: 'id', header: 'Quiz id', cell: (row) => row.quiz_id ?? '—' },
    {
      key: 'score',
      header: 'Score',
      cell: (row) => (row.score != null ? `${row.score}%` : '—'),
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Course-level charts sample quiz scores; modality donut is illustrative until sensory metrics land.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quiz score comparison</CardTitle>
            <CardDescription>From `/api/quizzes/results`.</CardDescription>
          </CardHeader>
          <CardContent>
            {q.isLoading ?
              <Skeleton className="h-[240px]" />
            : barData.length === 0 ?
              <p className="text-sm text-[var(--muted-foreground)]">No quiz rows.</p>
            : (
              <ComparisonBarChart data={barData} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Modality mix (sample)</CardTitle>
            <CardDescription>Donut for cohort sensory engagement distribution.</CardDescription>
          </CardHeader>
          <CardContent>
            <DistributionDonutChart data={donut} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Raw results</CardTitle>
          <CardDescription>Export hooks mirror student reports.</CardDescription>
        </CardHeader>
        <CardContent>
          {q.isLoading ?
            <Skeleton className="h-40" />
          : (
            <DataTable columns={columns} rows={quizzes} getRowKey={(row, i) => row.quiz_id ?? i} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
