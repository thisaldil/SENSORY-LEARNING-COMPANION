import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Check,
  Globe,
  Rocket,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const PROCESSING_STAGES = [
  { text: 'Analyzing content…', emoji: '🔍' },
  { text: 'Extracting key concepts…', emoji: '🎯' },
  { text: 'Generating visuals…', emoji: '🎨' },
  { text: 'Creating audio…', emoji: '🎵' },
  { text: 'Designing haptics…', emoji: '✨' },
]

const FUN_FACTS = [
  '🧠 Active recall can boost memory retention by up to 50%!',
  '👀 Switching between visual and audio keeps your brain engaged.',
  '🗣️ Teaching others what you learned is a powerful memory hack!',
  '🎮 Learning through play makes concepts stick longer.',
  '🌈 Using multiple senses together helps you learn faster!',
]

/** Maps API cognitive_state wire values to UI badge copy (matches mobile Neuro modes). */
function cognitiveBadge(wire) {
  switch (wire) {
    case 'LOW_LOAD':
      return {
        label: '🟡 LOW LOAD — Narrative Mode',
        className:
          'bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100 border-amber-200/80 dark:border-amber-800/60',
      }
    case 'OVERLOAD':
      return {
        label: '🔴 OVERLOAD — Simplified Mode',
        className:
          'bg-red-100 text-red-950 dark:bg-red-950/35 dark:text-red-100 border-red-200/80 dark:border-red-900/50',
      }
    case 'OPTIMAL':
    default:
      return {
        label: '🟢 OPTIMAL — Direct Mode',
        className:
          'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/35 dark:text-emerald-100 border-emerald-200/80 dark:border-emerald-800/50',
      }
  }
}

export function LearnProcessingStep({
  cognitiveWireState = 'OPTIMAL',
  isTransmuting,
  transmuteComplete,
  statusMessage,
  errorMessage,
  children,
  onCancel,
}) {
  const [stageIndex, setStageIndex] = useState(0)
  const [factIndex, setFactIndex] = useState(0)

  const activeStageIndex = transmuteComplete ? PROCESSING_STAGES.length - 1 : stageIndex

  useEffect(() => {
    if (transmuteComplete) return undefined
    const stageInterval = setInterval(() => {
      setStageIndex((prev) =>
        prev < PROCESSING_STAGES.length - 1 ? prev + 1 : prev,
      )
    }, 3500)
    return () => clearInterval(stageInterval)
  }, [transmuteComplete])

  useEffect(() => {
    const factInterval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % FUN_FACTS.length)
    }, 6000)
    return () => clearInterval(factInterval)
  }, [])

  const progressPercent =
    transmuteComplete ? 100 : (
      Math.round(((activeStageIndex + 1) / PROCESSING_STAGES.length) * 100)
    )

  const badge = cognitiveBadge(cognitiveWireState)

  const progressTitle =
    isTransmuting ? 'Transmuting text…'
    : transmuteComplete ? 'Done!'
    : 'Processing'

  const progressSubtitle =
    isTransmuting ? `State: ${cognitiveWireState}`
    : statusMessage || 'Almost there!'

  const etaLine =
    isTransmuting ? '⏱️ Talking to the Neuro‑Engine…' : '⏱️ Almost done!'

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-2">
      {/* Hero */}
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-5 flex h-[180px] w-[180px] items-center justify-center">
          <div
            className="absolute rounded-full border-2 border-[var(--accent)]/25"
            style={{ width: 170, height: 170 }}
            aria-hidden
          />
          <div
            className="absolute rounded-full border-2 border-[var(--primary)]/15"
            style={{ width: 130, height: 130 }}
            aria-hidden
          />
          <div className="learn-processing-pulse flex h-24 w-24 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/40">
            <Globe className="h-14 w-14" strokeWidth={1.25} aria-hidden />
          </div>
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
          Creating your lesson ✨
        </h2>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-[var(--muted-foreground)]">
          Mixing audio, visuals, and magic to make learning awesome!
        </p>
      </div>

      {/* Progress card */}
      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-[18px] shadow-[var(--shadow-card)]">
        <div className="mb-3.5 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15">
            <Rocket className="h-[22px] w-[22px] text-[var(--primary)]" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-semibold text-[var(--foreground)]">{progressTitle}</p>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{progressSubtitle}</p>
          </div>
          <span className="text-xl font-bold tabular-nums text-[var(--primary)]">
            {progressPercent}%
          </span>
        </div>
        <div className="mb-2.5 h-2.5 overflow-hidden rounded-full bg-[var(--primary)]/15">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-center text-xs text-[var(--muted-foreground)]">{etaLine}</p>
      </div>

      {/* Cognitive badge */}
      <div className="flex justify-center">
        <span
          className={`rounded-full border px-3.5 py-1.5 text-xs font-bold ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Stages */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm dark:shadow-none">
        <ul className="space-y-0">
          {PROCESSING_STAGES.map((stage, index) => {
            const isCurrent = index === activeStageIndex && !transmuteComplete
            const isCompleted = index < activeStageIndex || transmuteComplete
            return (
              <li
                key={stage.text}
                className={`flex items-center justify-between gap-2 rounded-xl px-2 py-2.5 ${
                  isCurrent ? 'bg-[var(--accent)]/12' : ''
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs ${
                      isCompleted ?
                        'bg-[var(--accent)] text-white'
                      : isCurrent ?
                        'bg-[var(--primary)] text-white'
                      : 'bg-[var(--surface-subtle)] text-[var(--muted-foreground)]'
                    }`}
                  >
                    {isCompleted ?
                      <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                    : <span aria-hidden>{stage.emoji}</span>}
                  </div>
                  <span
                    className={`text-sm ${
                      isCurrent ?
                        'font-semibold text-[var(--foreground)]'
                      : isCompleted ?
                        'text-[var(--muted-foreground)]'
                      : 'text-[var(--muted-foreground)]'
                    }`}
                  >
                    {stage.text}
                  </span>
                </div>
                {isCurrent && (
                  <div className="flex gap-1" aria-hidden>
                    <span className="learn-processing-dot h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                    <span
                      className="learn-processing-dot learn-processing-dot-delay-1 h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
                      style={{ animationDelay: '0.15s' }}
                    />
                    <span
                      className="learn-processing-dot learn-processing-dot-delay-2 h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
                      style={{ animationDelay: '0.3s' }}
                    />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {/* Fun fact */}
      <div className="rounded-[14px] border border-orange-200/80 bg-orange-50 px-3.5 py-3.5 dark:border-orange-900/40 dark:bg-orange-950/25">
        <p className="mb-1.5 text-xs font-bold text-orange-600 dark:text-orange-400">
          💡 Did you know?
        </p>
        <p className="text-sm leading-relaxed text-[var(--foreground)]">{FUN_FACTS[factIndex]}</p>
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="flex gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 dark:border-red-900/50 dark:bg-red-950/30">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700 dark:text-red-400" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">We hit a bump</p>
            <p className="mt-1 text-xs leading-relaxed text-red-900/90 dark:text-red-200/90">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Optional dev / actions slot */}
      {children}

      {/* Cancel */}
      <Button
        type="button"
        variant="outline"
        className="h-[50px] w-full gap-2 rounded-[14px] border-[1.5px] text-[var(--muted-foreground)]"
        onClick={onCancel}
      >
        <XCircle className="h-5 w-5" aria-hidden />
        Cancel
      </Button>
    </div>
  )
}
