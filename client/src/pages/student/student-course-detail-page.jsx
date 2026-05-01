import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchLesson, fetchLessonActivities } from '@/api/content'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

export function StudentCourseDetailPage() {
  const { id } = useParams()
  const lessonQ = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => fetchLesson(id),
    enabled: Boolean(id),
  })
  const activitiesQ = useQuery({
    queryKey: ['lesson-activities', id],
    queryFn: () => fetchLessonActivities(id),
    enabled: Boolean(id),
  })

  const lesson = lessonQ.data
  const activities = Array.isArray(activitiesQ.data)
    ? activitiesQ.data
    : lesson?.activities ?? []

  return (
    <div className="space-y-6">
      {lessonQ.isLoading ?
        <Skeleton className="h-10 w-2/3 max-w-md" />
      : lessonQ.isError ?
        <p className="text-sm text-[var(--destructive)]">Lesson could not be loaded.</p>
      : (
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{lesson.title}</h1>
          <p className="mt-2 max-w-3xl text-[var(--muted-foreground)]">
            {lesson.description ?? 'Lesson overview from GET /api/lessons/{id}.'}
          </p>
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Adaptive pathway</CardTitle>
              <CardDescription>
                Tie-ins: cognitive load prediction (`POST /api/v1/predict`), content processing (`POST /api/process`), and neuro-adaptive visuals (`POST /api/animation/neuro-adaptive`).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge>Dual coding</Badge>
              <Badge variant="outline">Embodied cues</Badge>
              <Badge variant="outline">Sensory overlay</Badge>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Activities</CardTitle>
              <CardDescription>
                From GET /api/lessons/:lesson_id/activities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activitiesQ.isLoading ?
                <>
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </>
              : activities.length === 0 ?
                <p className="text-sm text-[var(--muted-foreground)]">
                  No activities returned yet.
                </p>
              : activities.map((a) => (
                  <div
                    key={a.id ?? a.activity_id}
                    className="rounded-[10px] border border-[var(--border)] px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{a.title ?? a.name}</span>
                    <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                      {a.type ?? 'activity'}
                    </span>
                  </div>
                ))
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
              <CardDescription>
                Aggregate view via GET `/api/progress/me`; drill-down per lesson when backend exposes it.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-[var(--muted-foreground)]">
              Placeholder tab — connect lesson-scoped progress fields when available.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
              <CardDescription>
                Attach transmuted content (`GET /api/content/transmuted/latest`), vision notes (`POST /api/vision/notes/analyze`), or uploads from your storage layer.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-[var(--muted-foreground)]">
              Placeholder — wire file rows when your API lists attachments.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
