import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { enrichScript } from '@/api/sensory'
import { AnimationCanvasWeb } from '@/components/learn/animation-canvas-web'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  PRINCIPLE_COLORS,
  STATE_CONFIG,
  activeSceneIndexForTime,
  computeScriptDurationMs,
  normalizeCognitiveWire,
  playerUiStateKey,
  speedFactorForWire,
} from '@/lib/lesson-player-utils'

function PrincipleChip({ label }) {
  const color = PRINCIPLE_COLORS[label] ?? '#64748B'
  return (
    <span
      className="mr-1 mb-1 inline-block rounded border px-1 py-px text-[7px] font-bold tracking-wide uppercase"
      style={{
        backgroundColor: `${color}18`,
        borderColor: `${color}44`,
        color,
      }}
    >
      {String(label ?? '').replace(/_/g, ' ')}
    </span>
  )
}

function SceneThumbnail({ scene, index, isActive, isDone, onPress, thumbRef }) {
  const meta = scene?.meta ?? {}
  const principles = meta.ctmlPrinciples ?? []
  const salience = meta.salienceLevel ?? 'low'
  const salienceLevels = ['low', 'moderate', 'rich']
  const salienceIdx = Math.max(0, salienceLevels.indexOf(salience))

  return (
    <button
      ref={isActive ? thumbRef : undefined}
      type="button"
      onClick={onPress}
      className={`relative w-32 shrink-0 rounded-xl border p-2.5 text-left transition-shadow ${
        isActive ?
          'border-[var(--primary)] bg-[var(--primary)]/8 shadow-md shadow-[var(--primary)]/15'
        : isDone ?
          'border-[var(--border)] bg-[var(--card)] opacity-50'
        : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/30'
      }`}
    >
      <div
        className={`mb-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full text-[10px] font-bold ${
          isActive ? 'bg-[var(--primary)] text-white'
          : isDone ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
          : 'bg-[var(--surface-subtle)] text-[var(--muted-foreground)]'
        }`}
      >
        {isDone ? '✓' : index + 1}
      </div>
      {isActive && (
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--primary)]" aria-hidden />
      )}
      <p
        className={`mb-1.5 line-clamp-2 text-xs leading-[15px] font-medium ${
          isActive ? 'font-bold text-[var(--foreground)]'
          : isDone ? 'text-[var(--muted-foreground)]'
          : 'text-[var(--muted-foreground)]'
        }`}
      >
        {scene.text || `Scene ${index + 1}`}
      </p>
      <div className="mb-1 flex items-center gap-1">
        <span className="text-[7px] font-extrabold tracking-wide text-[var(--muted-foreground)] uppercase">
          salience
        </span>
        <div className="flex gap-0.5">
          {salienceLevels.map((l, i) => (
            <span
              key={l}
              className="h-0.5 w-3.5 rounded-sm"
              style={{
                backgroundColor:
                  i === salienceIdx ? '#2563EB'
                  : i < salienceIdx ? '#93C5FD'
                  : '#E2E8F0',
              }}
            />
          ))}
        </div>
      </div>
      {principles.length > 0 && (
        <div className="flex flex-row flex-wrap items-center">
          <PrincipleChip label={principles[0]} />
          {principles.length > 1 && (
            <span className="text-[8px] text-[var(--muted-foreground)]">+{principles.length - 1}</span>
          )}
        </div>
      )}
    </button>
  )
}

function NeuroEquation({ cognitiveState }) {
  const wire = normalizeCognitiveWire(cognitiveState)
  const score = wire === 'OVERLOAD' ? 0.85 : wire === 'OPTIMAL' ? 0.4 : 0.1
  const speed = (1 - score).toFixed(2)
  const density =
    wire === 'OVERLOAD' ? 'Minimal'
    : wire === 'OPTIMAL' ? 'Moderate'
    : 'Rich'
  const principle =
    wire === 'OVERLOAD' ? 'Coherence'
    : wire === 'OPTIMAL' ? 'Segmenting'
    : 'Personalization'

  const items = [
    { label: 'Δt equation', val: `${speed}× (1 − ${score})` },
    { label: 'Visual density', val: density },
    { label: 'CTML principle', val: principle },
  ]

  return (
    <div className="flex gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-0 flex-1 rounded-[10px] border border-[var(--border)] bg-[var(--surface-subtle)] p-2"
        >
          <p className="mb-0.5 text-[7px] font-extrabold tracking-wide text-[var(--muted-foreground)] uppercase">
            {item.label}
          </p>
          <p className="text-[10px] font-bold text-[var(--foreground)]">{item.val}</p>
        </div>
      ))}
    </div>
  )
}

function WebPreviewBanner() {
  return (
    <Badge variant="outline" className="shrink-0 border-dashed text-[10px] font-normal">
      Web preview · biometric banner N/A
    </Badge>
  )
}

function SensoryToggleWeb({ enabled, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[11px] font-semibold">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-[var(--border)]"
      />
      Sensory cues
    </label>
  )
}

export function LessonAnimationPanel({
  script,
  loading,
  error,
  onRetry,
  cognitiveState = 'OPTIMAL',
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [playbackScript, setPlaybackScript] = useState(null)
  const [sensoryEnabled, setSensoryEnabled] = useState(true)
  const intervalRef = useRef(null)
  const activeThumbRef = useRef(null)

  useEffect(() => {
    queueMicrotask(() => {
      if (!script) {
        setPlaybackScript(null)
        return
      }
      setPlaybackScript(script)
      const wire = normalizeCognitiveWire(cognitiveState)
      enrichScript({ script, cognitive_state: wire })
        .then((enriched) => {
          if (enriched && typeof enriched === 'object' && Array.isArray(enriched.scenes)) {
            setPlaybackScript(enriched)
          }
        })
        .catch(() => {})
    })
  }, [script, cognitiveState])

  useEffect(() => {
    queueMicrotask(() => {
      setIsPlaying(false)
      setCurrentTime(0)
    })
  }, [script])

  const durationMs = playbackScript ? computeScriptDurationMs(playbackScript) : 0
  const speedFactor = speedFactorForWire(cognitiveState)
  const uiKey = playerUiStateKey(cognitiveState)
  const stateConf = STATE_CONFIG[uiKey] ?? STATE_CONFIG.OPTIMAL

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
    if (!playbackScript || !isPlaying) return

    const step = 100 * speedFactor
    intervalRef.current = setInterval(() => {
      setCurrentTime((t) => {
        const next = Math.min(durationMs, t + step)
        if (next >= durationMs) setIsPlaying(false)
        return next
      })
    }, 100)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [playbackScript, isPlaying, speedFactor, durationMs])

  const activeSceneIdx =
    playbackScript ? activeSceneIndexForTime(playbackScript, currentTime) : 0

  useEffect(() => {
    activeThumbRef.current?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [activeSceneIdx])

  const jump = (idx) => {
    if (!playbackScript?.scenes?.[idx]) return
    setCurrentTime(playbackScript.scenes[idx].startTime ?? 0)
  }

  const progress = durationMs ? Math.min(100, (currentTime / durationMs) * 100) : 0
  const formatTime = (ms) => {
    const s = Math.floor(ms / 1000)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  const currentScene = playbackScript?.scenes?.[activeSceneIdx] ?? null

  return (
    <div className="flex w-full flex-col gap-3">
      {playbackScript && (
        <div className="flex items-center justify-between gap-2 px-1">
          <WebPreviewBanner />
          <p className="min-w-0 flex-1 truncate text-center text-base font-bold text-[var(--foreground)]">
            {playbackScript.title || 'Animation'}
          </p>
          <div className="shrink-0 rounded-lg bg-[var(--surface-subtle)] px-2 py-1">
            <span className="text-[10px] font-semibold text-[var(--muted-foreground)]">
              {formatTime(currentTime)} / {formatTime(durationMs)}
            </span>
          </div>
        </div>
      )}

      <div className="relative h-[260px] w-full overflow-hidden rounded-[20px] border border-slate-900 bg-slate-950">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[rgba(248,250,255,0.97)] px-6 dark:bg-[rgba(15,23,42,0.92)]">
            <Loader2 className="h-10 w-10 animate-spin text-[var(--primary)]" aria-hidden />
            <p className="text-base font-bold text-[var(--foreground)]">Adapting visuals…</p>
            <p className="text-center text-xs text-[var(--muted-foreground)]">
              Applying {(stateConf.label.split('·')[1] ?? '').trim() || 'balanced'} pacing
            </p>
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[rgba(248,250,255,0.97)] px-6 dark:bg-[rgba(15,23,42,0.92)]">
            <span className="text-3xl" aria-hidden>
              ⚠️
            </span>
            <p className="text-base font-bold text-red-700 dark:text-red-400">Animation error</p>
            <p className="text-center text-sm text-[var(--muted-foreground)]">{error}</p>
            {onRetry && (
              <Button type="button" size="sm" className="mt-2" onClick={onRetry}>
                Try again
              </Button>
            )}
          </div>
        )}
        {!script && !error && !loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[rgba(248,250,255,0.97)] dark:bg-[rgba(15,23,42,0.92)]">
            <span className="text-4xl opacity-45" aria-hidden>
              🎬
            </span>
            <p className="text-base font-bold text-[var(--foreground)]">No animation loaded</p>
            <p className="text-center text-xs text-[var(--muted-foreground)]">
              Enter a lesson with transmuted content to generate visuals
            </p>
          </div>
        )}

        {script && !error && (
          <AnimationCanvasWeb
            isPlaying={isPlaying && sensoryEnabled}
            script={playbackScript ?? script}
            currentTimeMs={currentTime}
          />
        )}

        {playbackScript && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]/15">
            <div
              className="h-full rounded-sm bg-[var(--primary)] transition-[width] duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {playbackScript && !loading && !error && currentScene?.text && (
        <div className="flex items-center gap-2.5 rounded-[14px] border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5 shadow-sm">
          <span className="shrink-0 rounded-lg bg-[var(--primary)] px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-white">
            {activeSceneIdx + 1}/{playbackScript.scenes.length}
          </span>
          <p className="flex-1 text-sm font-semibold leading-5 text-[var(--foreground)]">{currentScene.text}</p>
        </div>
      )}

      {playbackScript && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={isPlaying ? 'default' : 'outline'}
            className="h-[42px] min-w-[120px] flex-1 rounded-xl font-bold"
            onClick={() => {
              if (isPlaying) setIsPlaying(false)
              else {
                if (currentTime >= durationMs) setCurrentTime(0)
                setIsPlaying(true)
              }
            }}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-[42px] flex-1 rounded-xl font-bold"
            onClick={() => {
              setCurrentTime(0)
              setIsPlaying(true)
            }}
          >
            ↺ Reset
          </Button>
          <SensoryToggleWeb enabled={sensoryEnabled} onChange={setSensoryEnabled} />
          <div className="flex flex-col items-center rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-3.5 py-2">
            <span className="text-[7px] font-extrabold tracking-widest text-[var(--muted-foreground)] uppercase">
              Speed
            </span>
            <span className="text-sm font-extrabold text-[var(--primary)]">{speedFactor.toFixed(2)}×</span>
          </div>
        </div>
      )}

      {playbackScript && <NeuroEquation cognitiveState={cognitiveState} />}

      {playbackScript && playbackScript.scenes?.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] pb-2 pt-3 shadow-sm">
          <div className="mb-1 flex flex-wrap items-baseline gap-2 px-3.5">
            <span className="text-[10px] font-extrabold tracking-widest text-[var(--foreground)] uppercase">
              Scenes
            </span>
            <span className="flex-1 text-[9px] text-[var(--muted-foreground)]">
              Tap to jump · temporal contiguity — one beat at a time
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto px-3.5 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {playbackScript.scenes.map((scene, index) => (
              <SceneThumbnail
                key={scene.id ?? index}
                scene={scene}
                index={index}
                isActive={index === activeSceneIdx}
                isDone={index < activeSceneIdx}
                onPress={() => jump(index)}
                thumbRef={activeThumbRef}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
