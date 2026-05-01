import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BookOpen, LayoutGrid } from 'lucide-react'
import { useState } from 'react'
import { fetchLessons } from '@/api/content'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'

export function StudentCoursesPage() {
  const [mode, setMode] = useState('grid')
  const q = useQuery({ queryKey: ['lessons'], queryFn: fetchLessons })
  const lessons = q.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Backed by GET `/api/lessons`.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === 'grid' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setMode('grid')}
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            Grid
          </Button>
          <Button
            type="button"
            variant={mode === 'list' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setMode('list')}
          >
            List
          </Button>
        </div>
      </div>

      {q.isLoading && (
        <div className={mode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className={mode === 'grid' ? 'h-36' : 'h-20'} />
          ))}
        </div>
      )}

      {q.isError && (
        <EmptyState
          icon={BookOpen}
          title="Could not load lessons"
          description={q.error?.message ?? 'Network or server error.'}
        />
      )}

      {!q.isLoading && !q.isError && lessons.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="No lessons"
          description="Your account has no lessons yet."
        />
      )}

      {!q.isLoading && !q.isError && lessons.length > 0 && mode === 'grid' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((l) => {
            const id = l.id ?? l.lesson_id
            return (
              <Card key={id} className="flex flex-col border-[var(--border)] shadow-[var(--shadow-card)]">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit capitalize">
                    Lesson
                  </Badge>
                  <CardTitle className="text-lg leading-snug">{l.title}</CardTitle>
                  <CardDescription className="line-clamp-3">
                    {l.description ?? 'Multisensory learning path'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button asChild className="w-full">
                    <Link to={`/student/courses/${id}`}>Open</Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {!q.isLoading && !q.isError && lessons.length > 0 && mode === 'list' && (
        <div className="space-y-2">
          {lessons.map((l) => {
            const id = l.id ?? l.lesson_id
            return (
              <Link
                key={id}
                to={`/student/courses/${id}`}
                className="flex items-center justify-between gap-4 rounded-[12px] border border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-[var(--shadow-card)] hover:bg-[var(--surface-subtle)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{l.title}</p>
                  <p className="truncate text-xs text-[var(--muted-foreground)]">
                    {l.description ?? 'Lesson'}
                  </p>
                </div>
                <Badge>Open</Badge>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
