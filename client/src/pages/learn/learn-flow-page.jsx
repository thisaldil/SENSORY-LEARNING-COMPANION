import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import {
  createLesson,
  fetchLessonActivities,
  fetchMyProgress,
} from '@/api/content'
import {
  startProcess,
  getProcessingStatus,
  transmute,
  fetchLatestTransmuted,
} from '@/api/pipeline'
import {
  generateAnimation,
  generateNeuroAdaptiveAnimation,
  fetchNeuroAdaptiveLatest,
} from '@/api/visual'
import { enrichScript, createSensoryOverlay } from '@/api/sensory'
import { synthesizeTts } from '@/api/tts-voice'
import { generateQuiz, fetchQuiz, submitQuiz } from '@/api/quiz'
import { fetchGlobalActivities } from '@/api/activities'
import { postPredict } from '@/api/cognitive'
import { mockLessons } from '@/lib/mock-data'
import { isMockMode } from '@/lib/api-client'
import {
  predictStateToTransmute,
  extractTransmutedText,
  inferLessonMetaFromText,
} from '@/lib/learn-utils'
import { LEARN_SNAPSHOT_KEY, LEARN_SKIP_CONCEPT_REDIRECT_KEY } from '@/lib/learn-session-keys'
import { FlowStepper } from '@/components/learn/flow-stepper'
import { LearnPromptStep } from '@/components/learn/learn-prompt-step'
import { LearnProcessingStep } from '@/components/learn/learn-processing-step'
import { ScriptViewer } from '@/components/learn/script-viewer'
import { SimpleAudioPlayer } from '@/components/learn/simple-audio-player'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const STEP_LABELS = [
  'Prompt',
  'Processing',
  'Visual',
  'Quiz',
  'Activities',
  'Summary',
]

function TerminalJobStatus(data) {
  if (!data) return false
  const s = String(data.status ?? data.state ?? '').toLowerCase()
  return (
    s.includes('complete') ||
    s.includes('done') ||
    s.includes('success') ||
    s.includes('fail') ||
    s.includes('error')
  )
}

function JobSucceeded(data) {
  if (!data) return false
  const s = String(data.status ?? data.state ?? '').toLowerCase()
  return s.includes('complete') || s.includes('done') || s.includes('success')
}

export function LearnFlowPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID())

  const [step, setStep] = useState(0)
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonId, setLessonId] = useState(null)
  const [promptText, setPromptText] = useState('')
  const [cognitiveMode, setCognitiveMode] = useState(false)
  const [voiceCloneMode, setVoiceCloneMode] = useState(false)
  const [sensoryMode, setSensoryMode] = useState(false)

  const [jobId, setJobId] = useState(null)
  const transmuteRan = useRef(false)
  const conceptExploreOpenedRef = useRef(false)
  const [transmutedBundle, setTransmutedBundle] = useState(null)
  const [cognitiveForFlow, setCognitiveForFlow] = useState('OPTIMAL')

  const [visualPayload, setVisualPayload] = useState(null)
  const [overlayPayload, setOverlayPayload] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)

  const [quizId, setQuizId] = useState(null)
  const [quizDoc, setQuizDoc] = useState(null)
  const [answers, setAnswers] = useState({})
  const [quizResult, setQuizResult] = useState(null)
  const [isCreatingLesson, setIsCreatingLesson] = useState(false)

  const statusQ = useQuery({
    queryKey: ['learn-job', jobId],
    queryFn: () => getProcessingStatus(jobId),
    enabled: Boolean(jobId) && step === 1,
    refetchInterval: (q) => (TerminalJobStatus(q.state.data) ? false : 1200),
  })

  const transmuteMut = useMutation({
    mutationFn: async ({ cognitiveState }) => {
      const body = {
        text: promptText,
        cognitive_state: cognitiveState,
        lesson_id: lessonId ?? undefined,
        session_id: sessionId,
      }
      const res = await transmute(body)
      setTransmutedBundle(res)
      return res
    },
    onError: (e) => toast.error(e?.message ?? 'Transmute failed'),
    onSuccess: () => {
      sessionStorage.removeItem(LEARN_SKIP_CONCEPT_REDIRECT_KEY)
      conceptExploreOpenedRef.current = false
      toast.success('Adaptive text ready')
    },
  })

  useEffect(() => {
    if (!jobId || step !== 1) return
    const data = statusQ.data
    if (!TerminalJobStatus(data)) return
    if (transmuteRan.current) return
    if (!JobSucceeded(data)) {
      toast.message('Job finished without success — attempt transmute anyway.')
    }
    transmuteRan.current = true
    ;(async () => {
      let cognitiveState = 'OPTIMAL'
      if (cognitiveMode) {
        try {
          const pred = await postPredict({
            total_time_seconds: 95,
            total_questions: 2,
            question_interactions: [],
            back_navigations: 0,
            forward_navigations: 1,
            answer_changes: 0,
            correct_answers: 2,
            incorrect_answers: 0,
          })
          cognitiveState = predictStateToTransmute(pred.state)
          setCognitiveForFlow(pred.state ?? cognitiveState)
        } catch {
          cognitiveState = 'OPTIMAL'
        }
      }
      transmuteMut.mutate({ cognitiveState })
    })()
  }, [statusQ.data, jobId, step, cognitiveMode]) // eslint-disable-line react-hooks/exhaustive-deps -- transmuteMut stable enough

  const processMut = useMutation({
    mutationFn: ({ lessonId: lidOverride, rawText: rawOverride } = {}) =>
      startProcess({
        raw_text: rawOverride ?? promptText,
        lesson_id: lidOverride ?? lessonId ?? undefined,
        session_id: sessionId,
      }),
    onSuccess: (res) => {
      transmuteRan.current = false
      if (res.job_id) {
        setJobId(res.job_id)
        toast.success('Processing started — polling status.')
      } else {
        setJobId(`instant-${Date.now()}`)
        toast.message('No job id returned — running transmute.')
      }
    },
    onError: (e) => toast.error(e?.message ?? 'Process failed'),
  })

  const ensureLessonId = useCallback(async () => {
    if (lessonId) return lessonId
    const meta = inferLessonMetaFromText(promptText)
    const titleToUse = lessonTitle.trim() || meta.title
    setLessonTitle(titleToUse)
    const les = await createLesson({
      title: titleToUse,
      subject: meta.subject,
      content: promptText,
      description: promptText.slice(0, 280),
    })
    const lid = les.id ?? les.lesson_id ?? les._id
    if (!lid) throw new Error('Lesson created but no id was returned.')
    setLessonId(lid)
    return lid
  }, [lessonId, lessonTitle, promptText])

  const handleGenerateSensoryLesson = async () => {
    sessionStorage.removeItem(LEARN_SKIP_CONCEPT_REDIRECT_KEY)
    conceptExploreOpenedRef.current = false
    if (!promptText.trim()) {
      toast.error('Add lesson content first.')
      return
    }
    setIsCreatingLesson(true)
    try {
      const lid = await ensureLessonId()
      transmuteRan.current = false
      setStep(1)
      processMut.mutate({ lessonId: lid, rawText: promptText })
    } catch (e) {
      toast.error(e?.message ?? 'Could not create lesson.')
    } finally {
      setIsCreatingLesson(false)
    }
  }

  const handleStartProcessing = async () => {
    if (!promptText.trim()) {
      toast.error('Enter a prompt or paste content.')
      return
    }
    try {
      const lid = await ensureLessonId()
      transmuteRan.current = false
      processMut.mutate({ lessonId: lid, rawText: promptText })
    } catch (e) {
      toast.error(e?.message ?? 'Could not create lesson')
    }
  }

  const handleSkipJobInstantTransmute = async () => {
    let cognitiveState = 'OPTIMAL'
    if (cognitiveMode) {
      try {
        const pred = await postPredict({
          total_time_seconds: 95,
          total_questions: 2,
          question_interactions: [],
          back_navigations: 0,
          forward_navigations: 1,
          answer_changes: 0,
          correct_answers: 2,
          incorrect_answers: 0,
        })
        cognitiveState = predictStateToTransmute(pred.state)
        setCognitiveForFlow(pred.state ?? cognitiveState)
      } catch {
        cognitiveState = 'OPTIMAL'
      }
    }
    transmuteRan.current = true
    transmuteMut.mutate({ cognitiveState })
  }

  const visualMut = useMutation({
    mutationFn: async () => {
      const text = extractTransmutedText(transmutedBundle) || promptText
      if (cognitiveMode && text) {
        const neuro = await generateNeuroAdaptiveAnimation({
          transmuted_text: text,
          cognitive_state: predictStateToTransmute(cognitiveForFlow),
          concept: lessonTitle || 'Adaptive lesson',
          student_id: user?.id,
          lesson_id: lessonId ?? undefined,
          session_id: sessionId,
        })
        setVisualPayload(neuro)
        return neuro
      }
      const concept =
        lessonTitle || text.slice(0, 120) || 'Multisensory learning concept'
      const anim = await generateAnimation(concept, 'hybrid')
      setVisualPayload(anim)
      return anim
    },
    onError: (e) => toast.error(e?.message ?? 'Animation failed'),
    onSuccess: () => toast.success('Visual script ready'),
  })

  const refreshNeuroLatest = useMutation({
    mutationFn: () => fetchNeuroAdaptiveLatest(user?.id, sessionId),
    onSuccess: (data) => {
      setVisualPayload(data)
      toast.success('Loaded latest neuro-adaptive script')
    },
    onError: (e) => toast.error(e?.message ?? 'Could not load latest script'),
  })

  const sensoryMut = useMutation({
    mutationFn: async () => {
      const script = visualPayload?.script
      if (!script) throw new Error('Generate animation first')
      let working = script
      if (sensoryMode) {
        working = await enrichScript({
          script: working,
          cognitive_state: predictStateToTransmute(cognitiveForFlow),
        })
      }
      const overlay = await createSensoryOverlay({
        script: working,
        cognitive_state: predictStateToTransmute(cognitiveForFlow),
        concept: lessonTitle || 'Lesson',
        lesson_id: lessonId ?? undefined,
        student_id: user?.id,
        session_id: sessionId,
      })
      setOverlayPayload(overlay)
      return overlay
    },
    onError: (e) => toast.error(e?.message ?? 'Sensory overlay failed'),
    onSuccess: () => toast.success('Sensory overlay generated'),
  })

  const ttsMut = useMutation({
    mutationFn: async () => {
      const script = visualPayload?.script
      const line =
        script?.scenes?.[0]?.text ??
        extractTransmutedText(transmutedBundle) ??
        promptText.slice(0, 400)
      const url = await synthesizeTts(line, 'normal')
      setAudioUrl(url)
      return url
    },
    onError: (e) => toast.error(e?.message ?? 'TTS failed (check Google credentials)'),
    onSuccess: (url) => {
      if (url) toast.success('TTS audio ready')
      else toast.message('Mock mode: no audio blob.')
    },
  })

  const quizStartMut = useMutation({
    mutationFn: async () => {
      const lid =
        lessonId ?? (isMockMode() ? mockLessons[0]?.id : null)
      if (!lid) throw new Error('Set a lesson title (creates lesson) or pick an existing lesson id.')
      const q = await generateQuiz(lid)
      const id = q.id ?? q.quiz_id
      setQuizId(id)
      const full = await fetchQuiz(id)
      setQuizDoc(full)
      setAnswers({})
      setQuizResult(null)
      return full
    },
    onError: (e) => toast.error(e?.message ?? 'Quiz generation failed'),
    onSuccess: () => toast.success('Quiz loaded'),
  })

  const quizSubmitMut = useMutation({
    mutationFn: async () => {
      const questions = quizDoc?.questions ?? []
      const payload = {
        answers: questions.map((q) => ({
          question_id: q.id,
          answer_index: answers[q.id] ?? 0,
        })),
        behavior_data: {
          total_time_seconds: 180,
          question_interactions: [],
          back_navigations: 0,
          forward_navigations: 0,
          answer_changes: 0,
        },
      }
      const res = await submitQuiz(quizId, payload)
      setQuizResult(res)
      await qc.invalidateQueries({ queryKey: ['quiz-results'] })
      return res
    },
    onError: (e) => toast.error(e?.message ?? 'Submit failed'),
    onSuccess: () => toast.success('Quiz submitted'),
  })

  const activitiesQ = useQuery({
    queryKey: ['learn-activities', lessonId],
    queryFn: async () => {
      const global = await fetchGlobalActivities()
      const lessonActs =
        lessonId ? await fetchLessonActivities(lessonId) : []
      return { global, lessonActs }
    },
    enabled: step === 4,
  })

  const progressQ = useQuery({
    queryKey: ['progress-me'],
    queryFn: fetchMyProgress,
    enabled: step === 5,
  })

  const fetchLatestMut = useMutation({
    mutationFn: () => fetchLatestTransmuted(user?.id, lessonId ?? undefined),
    onSuccess: (doc) => {
      setTransmutedBundle(doc)
      toast.success('Latest transmuted document loaded')
    },
    onError: () => toast.message('No transmuted row yet (404 is OK during dev).'),
  })

  const scriptForViewer = visualPayload?.script ?? visualPayload?.data?.script

  const cognitiveWireForUi = useMemo(
    () => (cognitiveMode ? predictStateToTransmute(cognitiveForFlow) : 'OPTIMAL'),
    [cognitiveMode, cognitiveForFlow],
  )

  useEffect(() => {
    const st = location.state
    if (!st?.restoreLearnFlow) return
    const raw = sessionStorage.getItem(LEARN_SNAPSHOT_KEY)
    navigate('.', { replace: true, state: {} })
    if (!raw) return
    queueMicrotask(() => {
      try {
        const snap = JSON.parse(raw)
        setLessonId(snap.lessonId ?? null)
        setLessonTitle(snap.lessonTitle ?? '')
        setPromptText(snap.promptText ?? '')
        setTransmutedBundle(snap.transmutedBundle ?? null)
        setCognitiveForFlow(snap.cognitiveForFlow ?? 'OPTIMAL')
        setCognitiveMode(!!snap.cognitiveMode)
        setVoiceCloneMode(!!snap.voiceCloneMode)
        setSensoryMode(!!snap.sensoryMode)
        if (snap.sessionId) setSessionId(snap.sessionId)
        setJobId(snap.jobId ?? null)
        const target = typeof st.targetStep === 'number' ? st.targetStep : 2
        setStep(target)
        transmuteRan.current = true
        if (target === 1) {
          sessionStorage.setItem(LEARN_SKIP_CONCEPT_REDIRECT_KEY, '1')
          conceptExploreOpenedRef.current = false
        } else {
          sessionStorage.removeItem(LEARN_SKIP_CONCEPT_REDIRECT_KEY)
          conceptExploreOpenedRef.current = true
        }
        sessionStorage.removeItem(LEARN_SNAPSHOT_KEY)
      } catch {
        toast.error('Could not restore learn session')
      }
    })
  }, [location.state, navigate])

  useEffect(() => {
    if (step === 0) conceptExploreOpenedRef.current = false
  }, [step])

  const processingUiError = useMemo(() => {
    if (transmuteMut.isError) return transmuteMut.error?.message ?? 'Transmute failed'
    if (processMut.isError) return processMut.error?.message ?? 'Process failed'
    if (
      jobId &&
      statusQ.data &&
      TerminalJobStatus(statusQ.data) &&
      !JobSucceeded(statusQ.data)
    ) {
      return 'Processing finished without success. Retry from Technical details or use Skip job → transmute.'
    }
    return null
  }, [
    transmuteMut.isError,
    transmuteMut.error,
    processMut.isError,
    processMut.error,
    jobId,
    statusQ.data,
  ])

  const processingSubtitleHint = useMemo(() => {
    if (transmuteMut.isSuccess) return undefined
    if (!jobId) return 'Preparing your lesson…'
    if (!TerminalJobStatus(statusQ.data)) return 'Running content pipeline…'
    return undefined
  }, [jobId, statusQ.data, transmuteMut.isSuccess])

  const transmuteComplete = transmuteMut.isSuccess

  useEffect(() => {
    if (step !== 1 || !transmuteMut.isSuccess || !transmutedBundle) return
    if (conceptExploreOpenedRef.current) return
    if (sessionStorage.getItem(LEARN_SKIP_CONCEPT_REDIRECT_KEY) === '1') return

    conceptExploreOpenedRef.current = true
    sessionStorage.setItem(
      LEARN_SNAPSHOT_KEY,
      JSON.stringify({
        lessonId,
        lessonTitle,
        promptText,
        transmutedBundle,
        cognitiveForFlow,
        cognitiveMode,
        voiceCloneMode,
        sensoryMode,
        sessionId,
        jobId,
      }),
    )

    navigate('/learn/concept-explore', {
      state: {
        lessonId,
        rawText: promptText,
        transmute: transmutedBundle,
        cognitiveState: cognitiveWireForUi,
      },
    })
  }, [
    step,
    transmuteMut.isSuccess,
    transmutedBundle,
    lessonId,
    lessonTitle,
    promptText,
    cognitiveForFlow,
    cognitiveMode,
    voiceCloneMode,
    sensoryMode,
    sessionId,
    jobId,
    cognitiveWireForUi,
    navigate,
  ])

  const handleProcessingCancel = useCallback(() => {
    sessionStorage.removeItem(LEARN_SNAPSHOT_KEY)
    sessionStorage.removeItem(LEARN_SKIP_CONCEPT_REDIRECT_KEY)
    conceptExploreOpenedRef.current = false
    setStep(0)
    setJobId(null)
    transmuteRan.current = false
    setTransmutedBundle(null)
    transmuteMut.reset()
    processMut.reset()
    toast.message('Returned to prompt — your text is preserved.')
  }, [transmuteMut, processMut])

  const stepGuardNext = useCallback(() => {
    if (step === 0 && !promptText.trim()) {
      toast.error('Add prompt content first.')
      return false
    }
    if (step === 1 && !transmutedBundle && !transmuteMut.isSuccess) {
      toast.error('Wait for transmute or use skip.')
      return false
    }
    if (step === 2 && !visualPayload) {
      toast.error('Generate animation before continuing.')
      return false
    }
    if (step === 3 && !quizResult) {
      toast.error('Submit the quiz to finish this step.')
      return false
    }
    return true
  }, [
    step,
    promptText,
    transmutedBundle,
    transmuteMut.isSuccess,
    visualPayload,
    quizResult,
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Learn flow</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Mirrors the mobile sequence: process → transmute → visuals → sensory/TTS → quiz → activities → progress.
          </p>
        </div>
        <Badge variant="outline" className="w-fit font-mono text-xs">
          session {sessionId.slice(0, 8)}…
        </Badge>
      </div>

      <FlowStepper steps={STEP_LABELS} currentIndex={step} />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg">
              {step === 0 ? 'Create new lesson' : STEP_LABELS[step]}
            </CardTitle>
            {step === 0 && (
              <CardDescription className="mt-1">
                Set up the content for your sensory lesson — same flow as the mobile app.
              </CardDescription>
            )}
            {step === 1 && (
              <CardDescription className="mt-1">
                Pipeline status and neuro-adaptive transmute — styled like the mobile processing screen.
              </CardDescription>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Back
            </Button>
            <Button
              type="button"
              size="sm"
              title={step === 0 ? 'Use “Generate sensory lesson” below to continue.' : undefined}
              disabled={step === 0 || step >= STEP_LABELS.length - 1}
              onClick={() => {
                if (!stepGuardNext()) return
                setStep((s) => Math.min(STEP_LABELS.length - 1, s + 1))
              }}
            >
              Next
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 0 && (
            <LearnPromptStep
              promptText={promptText}
              onPromptChange={setPromptText}
              lessonTitle={lessonTitle}
              onLessonTitleChange={setLessonTitle}
              cognitiveMode={cognitiveMode}
              onCognitiveModeChange={setCognitiveMode}
              voiceCloneMode={voiceCloneMode}
              onVoiceCloneModeChange={setVoiceCloneMode}
              sensoryMode={sensoryMode}
              onSensoryModeChange={setSensoryMode}
              onGenerate={handleGenerateSensoryLesson}
              isCreatingLesson={isCreatingLesson}
            />
          )}

          {step === 1 && (
            <div className="rounded-[20px] bg-sky-50/90 px-4 py-6 dark:bg-sky-950/20 md:px-6">
              <LearnProcessingStep
                cognitiveWireState={cognitiveWireForUi}
                isTransmuting={transmuteMut.isPending}
                transmuteComplete={transmuteComplete}
                statusMessage={processingSubtitleHint}
                errorMessage={processingUiError}
                onCancel={handleProcessingCancel}
              >
                <details className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm shadow-sm">
                  <summary className="cursor-pointer select-none font-medium text-[var(--foreground)]">
                    Technical details &amp; retries
                  </summary>
                  <div className="mt-4 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleStartProcessing}
                        disabled={processMut.isPending}
                      >
                        {processMut.isPending ? 'Starting…' : 'POST /api/process + poll'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleSkipJobInstantTransmute}
                      >
                        Skip job → transmute
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fetchLatestMut.mutate()}
                        disabled={!user?.id}
                      >
                        GET transmuted/latest
                      </Button>
                    </div>
                    {jobId ?
                      <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface-subtle)]/50 p-4 text-sm">
                        <p className="font-medium">Job {jobId}</p>
                        {statusQ.isLoading ?
                          <Skeleton className="mt-2 h-8 w-full" />
                        : (
                          <pre className="mt-2 max-h-40 overflow-auto text-xs text-[var(--muted-foreground)]">
                            {JSON.stringify(statusQ.data ?? {}, null, 2)}
                          </pre>
                        )}
                      </div>
                    : (
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Job id appears after <code className="rounded bg-[var(--muted)]/30 px-1">POST /api/process</code>.
                        Mock mode synthesizes one automatically.
                      </p>
                    )}
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">Transmuted preview</p>
                      {transmuteMut.isPending ?
                        <Skeleton className="mt-2 h-24 w-full" />
                      : (
                        <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-[10px] bg-[var(--surface-subtle)] p-3 text-xs">
                          {extractTransmutedText(transmutedBundle) ||
                            'Run transmute to view Tier‑3 output.'}
                        </pre>
                      )}
                    </div>
                  </div>
                </details>
              </LearnProcessingStep>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => visualMut.mutate()}
                  disabled={visualMut.isPending || (!promptText && !transmutedBundle)}
                >
                  {cognitiveMode ? 'Neuro-adaptive animation' : 'Hybrid animation'}
                </Button>
                {cognitiveMode && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => refreshNeuroLatest.mutate()}
                    disabled={!user?.id}
                  >
                    GET neuro/latest
                  </Button>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => sensoryMut.mutate()}
                  disabled={!visualPayload || sensoryMut.isPending}
                >
                  Sensory enrich + overlay
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => ttsMut.mutate()}
                  disabled={ttsMut.isPending}
                >
                  TTS narrate (scene 1)
                </Button>
              </div>
              {voiceCloneMode && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  Voice cloning uses multipart POST `/tts/voice-clone`. Upload a reference WAV from{' '}
                  <Link to="/vision" className="text-[var(--primary)] underline">
                    Vision & voice lab
                  </Link>
                  .
                </p>
              )}
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium">Animation script</p>
                  <ScriptViewer script={scriptForViewer} />
                </div>
                <div className="space-y-4">
                  <SimpleAudioPlayer src={audioUrl} />
                  {overlayPayload && (
                    <details className="rounded-[12px] border border-[var(--border)] p-3">
                      <summary className="cursor-pointer text-sm font-medium">
                        Overlay payload
                      </summary>
                      <pre className="mt-2 max-h-48 overflow-auto text-xs">
                        {JSON.stringify(overlayPayload, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Button type="button" onClick={() => quizStartMut.mutate()} disabled={quizStartMut.isPending}>
                Generate quiz (needs lesson id)
              </Button>
              {!quizDoc ?
                <p className="text-sm text-[var(--muted-foreground)]">
                  Uses POST /api/quizzes/generate with a JSON body containing lesson_id.
                </p>
              : (
                <div className="space-y-4">
                  {(quizDoc.questions ?? []).map((q, idx) => (
                    <div key={q.id} className="rounded-[12px] border border-[var(--border)] p-4">
                      <p className="text-sm font-semibold">
                        {idx + 1}. {q.question}
                      </p>
                      <div className="mt-2 space-y-2">
                        {(q.options ?? []).map((opt, oi) => (
                          <label
                            key={oi}
                            className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-transparent px-2 py-1 hover:bg-[var(--surface-subtle)]"
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
                    onClick={() => quizSubmitMut.mutate()}
                    disabled={quizSubmitMut.isPending || !quizId}
                  >
                    Submit answers
                  </Button>
                  {quizResult && (
                    <div className="rounded-[12px] bg-[var(--primary)]/10 p-4 text-sm">
                      Score{' '}
                      {quizResult.score <= 1 ?
                        `${Math.round(quizResult.score * 100)}%`
                      : `${Math.round(quizResult.score)}%`}{' '}
                      · {quizResult.correct_count}/{quizResult.total_questions} correct
                      {quizResult.cognitive_load ?
                        ` · Load ${quizResult.cognitive_load}`
                      : ''}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              {activitiesQ.isLoading ?
                <Skeleton className="h-32 w-full" />
              : (
                <>
                  <div>
                    <p className="text-sm font-semibold">Lesson-scoped</p>
                    <ul className="mt-2 space-y-1 text-sm text-[var(--muted-foreground)]">
                      {(activitiesQ.data?.lessonActs ?? []).length ?
                        activitiesQ.data.lessonActs.map((a) => (
                          <li key={a.id}>{a.title ?? a.name}</li>
                        ))
                      : <li>No lesson activities (create/select lesson).</li>}
                    </ul>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold">GET /api/activities</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {(activitiesQ.data?.global ?? []).map((a) => (
                        <li key={a.id}>{a.title ?? a.name}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              {progressQ.isLoading ?
                <Skeleton className="h-40 w-full" />
              : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Progress snapshot</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>Lessons completed: {progressQ.data?.lessons_completed ?? '—'}</p>
                      <p>Quizzes taken: {progressQ.data?.quizzes_taken ?? '—'}</p>
                      <p>Average score: {progressQ.data?.avg_quiz_score ?? '—'}%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Shortcuts</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                      <Button variant="secondary" asChild>
                        <Link to="/quizzes">Quiz history</Link>
                      </Button>
                      <Button variant="secondary" asChild>
                        <Link to="/progress">Progress hub</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
