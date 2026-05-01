import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Camera,
  Clipboard,
  HelpCircle,
  Lightbulb,
  Loader2,
  Mic,
  MicOff,
  Rocket,
  Sparkles,
  FileText,
  Type,
  XCircle,
} from 'lucide-react'
import { analyzeNoteImage } from '@/api/vision-notes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const MAX_CHARS = 2000

export function LearnPromptStep({
  promptText,
  onPromptChange,
  lessonTitle,
  onLessonTitleChange,
  cognitiveMode,
  onCognitiveModeChange,
  voiceCloneMode,
  onVoiceCloneModeChange,
  sensoryMode,
  onSensoryModeChange,
  onGenerate,
  isCreatingLesson,
}) {
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop?.()
      } catch {
        /* ignore */
      }
    }
  }, [])

  const appendTranscript = useCallback(
    (value) => {
      const v = String(value ?? '').trim()
      if (!v) return
      onPromptChange((prev) => {
        const next = prev ? `${prev} ${v}` : v
        return next.length <= MAX_CHARS ? next : prev
      })
    },
    [onPromptChange],
  )

  const startRecording = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Speech recognition is not supported in this browser.')
      return
    }

    try {
      recognitionRef.current?.stop?.()
    } catch {
      /* ignore */
    }

    const rec = new SpeechRecognition()
    recognitionRef.current = rec
    rec.lang = 'en-US'
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = (event) => {
      const value = event.results?.[0]?.[0]?.transcript
      appendTranscript(value)
    }
    rec.onerror = () => setIsRecording(false)
    rec.onend = () => setIsRecording(false)

    setIsRecording(true)
    try {
      rec.start()
    } catch {
      setIsRecording(false)
      toast.error('Could not start microphone.')
    }
  }, [appendTranscript])

  const stopRecording = useCallback(() => {
    try {
      recognitionRef.current?.stop?.()
    } catch {
      /* ignore */
    } finally {
      setIsRecording(false)
    }
  }, [])

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (!text?.trim()) {
        toast.message('Clipboard is empty.')
        return
      }
      onPromptChange((prev) => {
        const piece = text.trim()
        const next = prev ? `${prev.trim()}\n\n${piece}` : piece
        return next.length <= MAX_CHARS ? next : next.slice(0, MAX_CHARS)
      })
      toast.success('Pasted from clipboard')
    } catch {
      toast.error('Clipboard access denied. Allow paste in your browser settings.')
    }
  }

  const handleScanFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Choose an image file (photo of your notes).')
      return
    }
    try {
      const parsed = await analyzeNoteImage(file)
      const extracted =
        typeof parsed === 'string' ?
          parsed
        : parsed?.text ?? parsed?.extracted_text ?? parsed?.content ?? ''
      const cleaned = String(extracted).trim()
      if (!cleaned) {
        toast.message('No text found in this image.')
        return
      }
      onPromptChange((prev) => {
        const next = prev ? `${prev.trim()}\n\n${cleaned}` : cleaned
        return next.length <= MAX_CHARS ? next : next.slice(0, MAX_CHARS)
      })
      toast.success('Note scanned — text added')
    } catch (err) {
      toast.error(err?.message ?? 'Could not analyze this image.')
    }
  }

  const canGenerate = promptText.trim().length > 0 && !isCreatingLesson

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Hero card */}
      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] px-6 py-8 text-center shadow-sm dark:shadow-none">
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/50">
          <Lightbulb className="h-10 w-10 text-orange-500 dark:text-orange-400" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
          Start your journey
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
          Add your lesson content below. We&apos;ll transform it into an interactive sensory experience —
          visuals, narration, and activities.
        </p>
      </div>

      {/* Content section */}
      <div>
        <div className="mb-4 flex items-center justify-between px-0 sm:px-1">
          <h3 className="text-base font-semibold text-[var(--foreground)]">Add your content</h3>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--primary)] hover:bg-[var(--muted)]/40"
            title="Paste notes or bullet lists. Use Scan note for photos of handwritten notes. Speak adds text via your browser’s microphone."
          >
            <HelpCircle className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm dark:shadow-none">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
              <span className="text-sm font-medium text-[var(--foreground)]">Lesson text</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 rounded-[12px] bg-[var(--primary)]/10 px-3 text-[var(--primary)] hover:bg-[var(--primary)]/15"
                onClick={handlePaste}
              >
                <Clipboard className="h-4 w-4" aria-hidden />
                Paste
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 rounded-[12px] bg-[var(--accent)]/15 px-3 text-[var(--foreground)] hover:bg-[var(--accent)]/25"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4 text-[var(--accent)]" aria-hidden />
                Scan note
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleScanFile}
              />
            </div>
          </div>

          <textarea
            id="learn-prompt-textarea"
            className="min-h-[160px] w-full resize-y rounded-[12px] border border-transparent bg-transparent px-1 py-2 text-sm leading-relaxed text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            placeholder={`Paste your lesson here…

Example: 'Photosynthesis is how plants make their food using sunlight, water, and air. It's like cooking with sunshine!'`}
            value={promptText}
            maxLength={MAX_CHARS}
            onChange={(e) => onPromptChange(e.target.value.slice(0, MAX_CHARS))}
          />

          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
              <FileText className="h-3.5 w-3.5" aria-hidden />
              <span>
                {promptText.length} / {MAX_CHARS}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {promptText.length > 0 && (
                <button
                  type="button"
                  className="rounded-full p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)]/40 hover:text-[var(--foreground)]"
                  onClick={() => onPromptChange('')}
                  aria-label="Clear text"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={
                  isRecording ?
                    'h-9 gap-2 rounded-2xl bg-orange-500 px-4 text-white hover:bg-orange-600 hover:text-white'
                  : 'h-9 gap-2 rounded-2xl bg-[var(--primary)]/10 px-4 text-[var(--primary)] hover:bg-[var(--primary)]/15'
                }
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ?
                  <>
                    <MicOff className="h-4 w-4" aria-hidden />
                    Stop
                  </>
                : <>
                    <Mic className="h-4 w-4" aria-hidden />
                    Speak
                  </>
                }
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sensory info */}
      <div className="flex gap-3 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--card)] shadow-sm">
          <Sparkles className="h-5 w-5 text-[var(--accent)]" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--foreground)]">Sensory lesson generation</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
            Your text becomes Tier‑3 adaptive copy, animation scenes, optional overlays, and quizzes aligned with
            your lesson on the server.
          </p>
        </div>
      </div>

      {/* Advanced options */}
      <details className="group rounded-[12px] border border-[var(--border)] bg-[var(--muted)]/20 px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-[var(--foreground)]">
          Advanced — lesson title &amp; flow options
        </summary>
        <div className="mt-4 space-y-4 pb-1">
          <div className="space-y-2">
            <Label htmlFor="lesson-title-override" className="flex items-center gap-2 text-xs font-normal">
              <Type className="h-3.5 w-3.5" aria-hidden />
              Lesson title override (optional — inferred from text if empty)
            </Label>
            <Input
              id="lesson-title-override"
              className="rounded-[10px]"
              placeholder="e.g. Photosynthesis basics"
              value={lessonTitle}
              onChange={(e) => onLessonTitleChange(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex cursor-pointer items-start gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--card)] p-3 text-xs">
              <input
                type="checkbox"
                checked={cognitiveMode}
                onChange={(e) => onCognitiveModeChange(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[var(--border)]"
              />
              <span>
                <span className="font-medium text-[var(--foreground)]">Cognitive load path</span>
                <span className="mt-0.5 block text-[var(--muted-foreground)]">
                  Predictor → neuro-adaptive transmute &amp; animation
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--card)] p-3 text-xs">
              <input
                type="checkbox"
                checked={voiceCloneMode}
                onChange={(e) => onVoiceCloneModeChange(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[var(--border)]"
              />
              <span>
                <span className="font-medium text-[var(--foreground)]">Voice clone later</span>
                <span className="mt-0.5 block text-[var(--muted-foreground)]">
                  Show hints for `/tts/voice-clone` in the visual step
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--card)] p-3 text-xs">
              <input
                type="checkbox"
                checked={sensoryMode}
                onChange={(e) => onSensoryModeChange(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[var(--border)]"
              />
              <span>
                <span className="font-medium text-[var(--foreground)]">Sensory overlay</span>
                <span className="mt-0.5 block text-[var(--muted-foreground)]">
                  Enrich script + generate overlay assets
                </span>
              </span>
            </label>
          </div>
        </div>
      </details>

      {/* Primary CTA */}
      <Button
        type="button"
        size="lg"
        disabled={!canGenerate}
        className="relative h-14 w-full overflow-hidden rounded-2xl text-base font-semibold shadow-lg shadow-[var(--primary)]/25"
        onClick={onGenerate}
      >
        <span className="relative z-10 inline-flex items-center justify-center gap-2">
          {isCreatingLesson ?
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Creating lesson…
            </>
          : <>
              <Rocket className="h-6 w-6" aria-hidden />
              Generate sensory lesson
            </>
          }
        </span>
      </Button>

      {/* Tips */}
      <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4 dark:border-orange-900/50 dark:bg-orange-950/30">
        <p className="text-sm font-medium text-[var(--foreground)]">Quick tips</p>
        <ul className="mt-3 space-y-2">
          {[
            'Keep sentences simple and clear.',
            'Add fun facts to make it memorable.',
            'Use examples learners can relate to.',
          ].map((tip) => (
            <li key={tip} className="flex gap-2 text-xs text-[var(--muted-foreground)]">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" aria-hidden />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
