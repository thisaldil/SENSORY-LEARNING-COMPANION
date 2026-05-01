import { activeSceneIndexForTime } from '@/lib/lesson-player-utils'

export function AnimationCanvasWeb({ isPlaying, script, currentTimeMs }) {
  const scenes = script?.scenes
  if (!Array.isArray(scenes) || !scenes.length) return null

  const idx = activeSceneIndexForTime(script, currentTimeMs)
  const scene = scenes[idx]
  const actors = scene?.actors ?? []

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(37,99,235,0.12)_0%,_transparent_65%)]" />
      {actors.map((a, i) => {
        const anim = a.animation ?? 'pulse'
        const motion =
          isPlaying && anim === 'pulse' ? 'animate-pulse'
          : isPlaying && anim === 'wave' ? 'lesson-player-wave'
          : ''
        return (
          <div
            key={i}
            className={`absolute flex items-center justify-center rounded-full border-2 border-white/20 shadow-lg ${motion}`}
            style={{
              left: `${a.x ?? 50}%`,
              top: `${a.y ?? 50}%`,
              width: 44,
              height: 44,
              transform: 'translate(-50%, -50%)',
              backgroundColor: a.color ?? '#2563EB',
            }}
            title={a.type ?? 'actor'}
          >
            <span className="text-[10px] font-bold uppercase text-white/90">{a.type?.slice(0, 3)}</span>
          </div>
        )
      })}
      {!actors.length && (
        <div className="flex h-full items-center justify-center text-sm text-slate-400">
          No actors in this scene — narration only
        </div>
      )}
    </div>
  )
}
