import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchGlobalActivities } from '@/api/activities'
import { fetchLessonActivities } from '@/api/content'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

export function ActivitiesHubPage() {
  const [lessonId, setLessonId] = useState('')

  const globalQ = useQuery({
    queryKey: ['activities-global'],
    queryFn: fetchGlobalActivities,
  })

  const lessonQ = useQuery({
    queryKey: ['activities-lesson', lessonId],
    queryFn: () => fetchLessonActivities(lessonId),
    enabled: Boolean(lessonId.trim()),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activities</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          GET /api/activities plus lesson-scoped GET /api/lessons/:lesson_id/activities.
        </p>
      </div>

      <Tabs defaultValue="global">
        <TabsList>
          <TabsTrigger value="global">Catalog</TabsTrigger>
          <TabsTrigger value="lesson">By lesson</TabsTrigger>
        </TabsList>
        <TabsContent value="global">
          <Card>
            <CardHeader>
              <CardTitle>Global activities</CardTitle>
              <CardDescription>Shared tasks surfaced across lessons.</CardDescription>
            </CardHeader>
            <CardContent>
              {globalQ.isLoading ?
                <Skeleton className="h-32 w-full" />
              : (
                <ul className="space-y-2 text-sm">
                  {(globalQ.data ?? []).map((a) => (
                    <li key={a.id} className="rounded-[10px] border border-[var(--border)] px-3 py-2">
                      <span className="font-medium">{a.title ?? a.name}</span>
                      <span className="ml-2 text-[var(--muted-foreground)]">{a.type ?? ''}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="lesson">
          <Card>
            <CardHeader>
              <CardTitle>Lesson activities</CardTitle>
              <CardDescription>Paste a lesson ObjectId string from Mongo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-md space-y-2">
                <Label htmlFor="lid">Lesson ID</Label>
                <Input
                  id="lid"
                  placeholder="668f..."
                  value={lessonId}
                  onChange={(e) => setLessonId(e.target.value)}
                />
              </div>
              {lessonId.trim() ?
                lessonQ.isLoading ?
                  <Skeleton className="h-32 w-full" />
                : (
                  <ul className="space-y-2 text-sm">
                    {(lessonQ.data ?? []).map((a) => (
                      <li key={a.id} className="rounded-[10px] border border-[var(--border)] px-3 py-2">
                        {a.title ?? a.name}
                      </li>
                    ))}
                  </ul>
                )
              : (
                <p className="text-sm text-[var(--muted-foreground)]">Enter a lesson id to load rows.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
