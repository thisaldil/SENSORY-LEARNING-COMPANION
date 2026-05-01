/** Normalize cognitive wire for API + UI (OVERLOAD | OPTIMAL | LOW_LOAD). */
export function normalizeCognitiveWire(s) {
  const u = String(s ?? 'OPTIMAL').toUpperCase()
  if (u.includes('LOW')) return 'LOW_LOAD'
  if (u.includes('OVER')) return 'OVERLOAD'
  return 'OPTIMAL'
}

/** Maps wire → STATE_CONFIG key (LOW | OPTIMAL | OVERLOAD). */
export function playerUiStateKey(wire) {
  const w = normalizeCognitiveWire(wire)
  if (w === 'LOW_LOAD') return 'LOW'
  if (w === 'OVERLOAD') return 'OVERLOAD'
  return 'OPTIMAL'
}

export const STATE_CONFIG = {
  LOW: { label: 'Low Load · Deep Dive', color: '#3B82F6', bg: '#EFF6FF' },
  OPTIMAL: { label: 'Optimal · Balanced', color: '#16A34A', bg: '#F0FDF4' },
  OVERLOAD: {
    label: 'High Load · Simplified',
    color: '#EA580C',
    bg: '#FFF7ED',
  },
}

export const PRINCIPLE_COLORS = {
  coherence: '#2563EB',
  signaling: '#7C3AED',
  temporal_contiguity: '#0891B2',
  redundancy: '#059669',
  segmenting: '#D97706',
  personalization: '#DB2777',
}

export function speedFactorForWire(wire) {
  const w = normalizeCognitiveWire(wire)
  if (w === 'OVERLOAD') return 0.4
  if (w === 'OPTIMAL') return 0.75
  return 1.2
}

/** Effective timeline length in ms (falls back to scene span). */
export function computeScriptDurationMs(script) {
  if (!script?.scenes?.length) return Math.max(1, script?.duration ?? 0)
  let maxEnd = 0
  for (const s of script.scenes) {
    const end = (s.startTime ?? 0) + (s.duration ?? 0)
    if (end > maxEnd) maxEnd = end
  }
  return Math.max(script.duration ?? 0, maxEnd, 1)
}

export function activeSceneIndexForTime(script, currentTimeMs) {
  const scenes = script?.scenes
  if (!Array.isArray(scenes) || !scenes.length) return 0
  const idx = scenes.findIndex(
    (s) =>
      currentTimeMs >= (s.startTime ?? 0)
      && currentTimeMs < (s.startTime ?? 0) + (s.duration ?? 0),
  )
  if (idx !== -1) return idx
  for (let i = scenes.length - 1; i >= 0; i--) {
    if (currentTimeMs >= (scenes[i].startTime ?? 0)) return i
  }
  return 0
}
