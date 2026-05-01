import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { fetchQuiz, submitQuiz } from '@/api/quiz'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function QuizSessionPage() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const lessonBackId = location.state?.lessonId
  const qc = useQueryClient()
  const [answers, setAnswers] = useState({})

  const quizQ = useQuery({
    queryKey: ['quiz-session', quizId],
    queryFn: () => fetchQuiz(quizId),
    enabled: Boolean(quizId),
  })

  const submitMut = useMutation({
    mutationFn: async () => {
      const questions = quizQ.data?.questions ?? []
      const payload = {
        answers: questions.map((q) => ({
          question_id: q.id,
          answer_index: answers[q.id] ?? 0,
        })),
        behavior_data: {
          total_time_seconds: 120,
          question_interactions: [],
          back_navigations: 0,
          forward_navigations: 0,
          answer_changes: 0,
        },
      }
      return submitQuiz(quizId, payload)
    },
    onSuccess: (res) => {
      toast.success('Quiz submitted')
      qc.invalidateQueries({ queryKey: ['quiz-results'] })
      const raw = res?.score ?? 0
      const pct = raw <= 1 ? `${Math.round(raw * 100)}%` : `${Math.round(raw)}%`
      toast.message(`Score ${pct}`)
      navigate('/quizzes')
    },
    onError: (e) => toast.error(e?.message ?? 'Submit failed'),
  })

  if (!quizId) {
    return (
      <div className="p-6">
        <p className="text-sm text-[var(--muted-foreground)]">Missing quiz id.</p>
        <Button asChild variant="link" className="mt-2 px-0">
          <Link to="/learn/player">Lesson player</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Quiz</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          From lesson player · <span className="font-mono">{quizId}</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Questions</CardTitle>
          <CardDescription>
            Single session — submit when ready. Results sync to the quizzes hub.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {quizQ.isLoading && <Skeleton className="h-40 w-full" />}
          {quizQ.isError && (
            <p className="text-sm text-[var(--destructive)]">Could not load quiz.</p>
          )}
          {quizQ.data && (
            <>
              {(quizQ.data.questions ?? []).map((q, idx) => (
                <div key={q.id} className="rounded-[12px] border border-[var(--border)] p-4">
                  <p className="text-sm font-semibold">
                    {idx + 1}. {q.question}
                  </p>
                  <div className="mt-2 space-y-2">
                    {(q.options ?? []).map((opt, oi) => (
                      <label
                        key={oi}
                        className="flex cursor-pointer items-center gap-2 rounded-[10px] px-2 py-1 hover:bg-[var(--surface-subtle)]"
                      >
                        <input
                          type="radio"
                          name={q.id}
                          checked={answers[q.id] === oi}
                          onChange={() =>
                            setAnswers((prev) => ({ ...prev, [q.id]: oi }))
                          }
                        />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <Button
                type="button"
                disabled={submitMut.isPending}
                onClick={() => submitMut.mutate()}
              >
                {submitMut.isPending ? 'Submitting…' : 'Submit answers'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Button variant="outline" asChild>
        <Link
          to={
            lessonBackId ?
              `/learn/player?lesson_id=${encodeURIComponent(String(lessonBackId))}`
            : '/learn/player'
          }
        >
          ← Back to lesson player
        </Link>
      </Button>
    </div>
  )
}
