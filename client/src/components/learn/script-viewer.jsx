import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

function JsonLeaf({ label, value }) {
  return (
    <div className="rounded-[8px] bg-[var(--surface-subtle)] px-2 py-1 font-mono text-xs">
      <span className="text-[var(--muted-foreground)]">{label}: </span>
      <span className="text-[var(--foreground)]">{String(value)}</span>
    </div>
  )
}

export function ScriptViewer({ script, className }) {
  const scenes = script?.scenes
  const [open, setOpen] = useState(() =>
    Array.isArray(scenes) ? scenes.map((_, i) => i === 0) : [],
  )

  const pretty = useMemo(() => {
    try {
      return JSON.stringify(script ?? {}, null, 2)
    } catch {
      return '{}'
    }
  }, [script])

  if (!script || typeof script !== 'object') {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">No animation script loaded.</p>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {script.title && (
        <p className="text-sm font-semibold text-[var(--foreground)]">{script.title}</p>
      )}
      {Array.isArray(scenes) && scenes.length > 0 ?
        <ul className="space-y-2">
          {scenes.map((scene, idx) => {
            const isOpen = open[idx]
            return (
              <li
                key={scene.id ?? idx}
                className="rounded-[12px] border border-[var(--border)] bg-[var(--card)]"
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-[12px]"
                  onClick={() =>
                    setOpen((prev) => {
                      const n = [...prev]
                      n[idx] = !n[idx]
                      return n
                    })
                  }
                >
                  {isOpen ?
                    <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
                  : <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />}
                  <span>
                    Scene {idx + 1}
                    {scene.text ? ` — ${scene.text}` : ''}
                  </span>
                </button>
                {isOpen && (
                  <div className="space-y-2 border-t border-[var(--border)] px-3 py-3">
                    <JsonLeaf label="Timing" value={`${scene.startTime ?? 0}ms → ${(scene.startTime ?? 0) + (scene.duration ?? 0)}ms`} />
                    {Array.isArray(scene.actors) && scene.actors.length > 0 && (
                      <div className="text-xs text-[var(--muted-foreground)]">
                        <span className="font-semibold text-[var(--foreground)]">Actors:</span>{' '}
                        {scene.actors.map((a, i) => (
                          <span key={i} className="ml-1 inline-block rounded-[6px] bg-[var(--surface-subtle)] px-1.5 py-0.5">
                            {a.type} ({a.animation})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      : null}
      <details className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-subtle)]/40">
        <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-[var(--muted-foreground)]">
          Raw JSON
        </summary>
        <pre className="max-h-[220px] overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-[11px] leading-relaxed">
          {pretty}
        </pre>
      </details>
    </div>
  )
}
