import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { createLesson, fetchLessons } from '@/api/content'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'

export function LecturerCoursesPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const q = useQuery({ queryKey: ['lessons'], queryFn: fetchLessons })
  const mut = useMutation({
    mutationFn: () => createLesson({ title, description }),
    onSuccess: async () => {
      toast.success('Lesson created')
      setOpen(false)
      setTitle('')
      setDescription('')
      await qc.invalidateQueries({ queryKey: ['lessons'] })
    },
    onError: (e) => toast.error(e?.message ?? 'Create failed'),
  })

  const rows = (q.data ?? []).map((l) => ({
    ...l,
    actions: [
      {
        label: 'Open',
        onClick: () => navigate(`/lecturer/courses/${l.id ?? l.lesson_id}`),
      },
      {
        label: 'Duplicate (stub)',
        onClick: () => toast.message('Wire duplicate endpoint'),
      },
    ],
  }))

  const columns = [
    {
      key: 'title',
      header: 'Title',
      cell: (row) => row.title,
    },
    {
      key: 'updated',
      header: 'Updated',
      cell: (row) =>
        row.updated_at ?
          new Date(row.updated_at).toLocaleDateString()
        : '—',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage courses</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Lists lessons via GET `/api/lessons`; create via POST `/api/lessons`.
          </p>
        </div>
        <Button type="button" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New lesson
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lesson table</CardTitle>
          <CardDescription>Sticky header + row actions pattern.</CardDescription>
        </CardHeader>
        <CardContent>
          {q.isLoading ?
            <Skeleton className="h-48 w-full" />
          : (
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(row) => row.id ?? row.lesson_id}
            />
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-[var(--muted-foreground)]">
        Preview as student:{' '}
        <Link to="/student/courses" className="text-[var(--primary)] hover:underline">
          student catalog
        </Link>
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create lesson</DialogTitle>
            <DialogDescription>
              Sends LessonCreate payload to your backend (mock when offline).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="lesson-title">Title</Label>
              <Input
                id="lesson-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Neural pathways refresher"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-desc">Description</Label>
              <Input
                id="lesson-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short abstract"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!title.trim() || mut.isPending}
              onClick={() => mut.mutate()}
            >
              {mut.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
