import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchQuizResults } from '@/api/quiz'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'

export function QuizzesHubPage() {
  const q = useQuery({ queryKey: ['quiz-results'], queryFn: fetchQuizResults })

  const columns = [
    { key: 'quiz', header: 'Quiz', cell: (row) => row.quiz_id ?? row.quizId ?? '—' },
    {
      key: 'score',
      header: 'Score',
      cell: (row) =>
        row.score != null ?
          row.score <= 1 ?
            `${Math.round(row.score * 100)}%`
          : `${Math.round(row.score)}%`
        : '—',
    },
    {
      key: 'when',
      header: 'Completed',
      cell: (row) =>
        row.completed_at ?
          new Date(row.completed_at).toLocaleString()
        : '—',
    },
  ]

  const rows = q.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quizzes</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            History from GET /api/quizzes/results — run the Learn flow to generate and submit a quiz.
          </p>
        </div>
        <Button asChild>
          <Link to="/learn">Open Learn flow</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent results</CardTitle>
          <CardDescription>Sorted server-side (mock uses static samples).</CardDescription>
        </CardHeader>
        <CardContent>
          {q.isLoading ?
            <Skeleton className="h-48 w-full" />
          : (
            <DataTable columns={columns} rows={rows} getRowKey={(row, i) => row.quiz_id ?? i} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
