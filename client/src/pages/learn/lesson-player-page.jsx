import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { generateQuiz } from '@/api/quiz'
import { LessonAnimationPanel } from '@/components/learn/lesson-animation-panel'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useNeuroAdaptiveScript } from '@/hooks/use-neuro-adaptive-script'
import { normalizeCognitiveWire } from '@/lib/lesson-player-utils'

export function LessonPlayerPage() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const lessonId = searchParams.get('lesson_id') ?? undefined

  const initialWire = useMemo(
    () => normalizeCognitiveWire(location.state?.cognitiveState ?? 'OPTIMAL'),
    [location.state?.cognitiveState],
  )

  const [cognitiveState, setCognitiveState] = useState(initialWire)
  const [quizBusy, setQuizBusy] = useState(false)

  const { script, loading, error, refetch } = useNeuroAdaptiveScript({
    lessonId,
    studentId: user?.id,
    sessionId: location.state?.sessionId ?? undefined,
    cognitiveState,
    concept: undefined,
  })

  const handleTestYourself = async () => {
    if (!lessonId) {
      toast.error('Missing lesson id')
      return
    }
    setQuizBusy(true)
    try {
      const quiz = await generateQuiz(lessonId)
      const id = quiz?.id ?? quiz?.quiz_id
      if (!id) throw new Error('Quiz id missing from response')
      navigate(`/learn/quiz/${encodeURIComponent(id)}`, { state: { lessonId } })
    } catch (e) {
      toast.error(e?.message ?? 'Could not generate quiz')
    } finally {
      setQuizBusy(false)
    }
  }

  if (!lessonId) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Lesson player</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Open this page from Concept explore after transmute, or append{' '}
          <code className="rounded bg-[var(--muted)]/30 px-1 text-xs">?lesson_id=…</code> to the URL.
        </p>
        <Button asChild variant="secondary">
          <Link to="/learn">Back to Learn flow</Link>
        </Button>
      </div>
    )
  }

  if (!user?.id) {
    return (
      <p className="p-6 text-sm text-[var(--muted-foreground)]">
        Sign in to load your neuro-adaptive script.
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Lesson player</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Neuro-adaptive animation · lesson{' '}
            <span className="font-mono text-xs">{lessonId}</span>
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="cog-wire" className="text-xs text-[var(--muted-foreground)]">
            Cognitive wire (demo)
          </Label>
          <select
            id="cog-wire"
            className="rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
            value={cognitiveState}
            onChange={(e) => setCognitiveState(e.target.value)}
          >
            <option value="OPTIMAL">OPTIMAL</option>
            <option value="OVERLOAD">OVERLOAD</option>
            <option value="LOW_LOAD">LOW_LOAD</option>
          </select>
        </div>
      </div>

      <LessonAnimationPanel
        lessonId={lessonId}
        studentId={user.id}
        sessionId={location.state?.sessionId}
        script={script}
        loading={loading}
        error={error}
        onRetry={refetch}
        cognitiveState={cognitiveState}
      />

      <div className="flex justify-end border-t border-[var(--border)] pt-4">
        <Button
          type="button"
          className="min-h-[44px] min-w-[150px] rounded-full font-bold"
          disabled={quizBusy}
          onClick={handleTestYourself}
        >
          {quizBusy ? 'Generating…' : 'Test yourself'}
        </Button>
      </div>
    </div>
  )
}
