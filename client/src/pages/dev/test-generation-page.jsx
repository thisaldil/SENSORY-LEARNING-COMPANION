import { useQuery } from '@tanstack/react-query'
import { fetchDebugTestGeneration } from '@/api/visual'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function TestGenerationPage() {
  const q = useQuery({
    queryKey: ['debug-test-generation'],
    queryFn: fetchDebugTestGeneration,
  })

  if (!import.meta.env.DEV) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">
        This diagnostics page is available only in development builds.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Gemini / animation diagnostics</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          GET /api/debug/test-generation — verifies API keys and model wiring on the server.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Response</CardTitle>
          <CardDescription>Raw JSON from FastAPI debug route.</CardDescription>
        </CardHeader>
        <CardContent>
          {q.isLoading ?
            <Skeleton className="h-24 w-full" />
          : q.isError ?
            <p className="text-sm text-[var(--destructive)]">{q.error?.message ?? 'Request failed'}</p>
          : (
            <pre className="overflow-auto rounded-[10px] bg-[var(--surface-subtle)] p-4 text-xs">
              {JSON.stringify(q.data ?? {}, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
