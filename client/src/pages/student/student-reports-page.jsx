import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetchLessons, fetchQuizResults, fetchMyProgress } from '@/api/content'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/ui/data-table'

export function StudentReportsPage() {
  const [q, setQ] = useState('')
  const lessonsQ = useQuery({ queryKey: ['lessons'], queryFn: fetchLessons })
  const quizzesQ = useQuery({ queryKey: ['quiz-results'], queryFn: fetchQuizResults })
  const progressQ = useQuery({ queryKey: ['progress-me'], queryFn: fetchMyProgress })

  const rows = useMemo(() => {
    const quizzes = quizzesQ.data ?? []
    return quizzes
      .filter((r) =>
        q ? JSON.stringify(r).toLowerCase().includes(q.toLowerCase()) : true,
      )
      .map((r) => ({
        ...r,
        actions: [
          {
            label: 'Export row',
            onClick: () => toast.message('Export stub — connect CSV endpoint.'),
          },
        ],
      }))
  }, [quizzesQ.data, q])

  const columns = [
    {
      key: 'quiz',
      header: 'Quiz',
      cell: (row) => row.quiz_id ?? row.quizId ?? '—',
    },
    {
      key: 'score',
      header: 'Score',
      cell: (row) =>
        row.score != null ? `${row.score}%` : row.percent ?? '—',
    },
    {
      key: 'completed',
      header: 'Completed',
      cell: (row) =>
        row.completed_at ?
          new Date(row.completed_at).toLocaleString()
        : row.completedAt ?? '—',
    },
  ]

  function exportAll() {
    toast.success('Prepared CSV stub — hook to GET /api/quizzes/results.')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Filter quiz exports; lessons loaded for future joins ({lessonsQ.data?.length ?? 0}).
          </p>
        </div>
        <Button type="button" onClick={exportAll}>
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search raw quiz result payloads.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="report-q">Search</Label>
            <Input
              id="report-q"
              placeholder="quiz id, score…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Progress snapshot: streak {progressQ.data?.streak_days ?? '—'} days
            {progressQ.isFetching ? ' (refreshing…)' : ''}.
          </p>
        </CardContent>
      </Card>

      <DataTable columns={columns} rows={rows} getRowKey={(row, i) => row.quiz_id ?? i} />
    </div>
  )
}
