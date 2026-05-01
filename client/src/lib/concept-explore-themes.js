/** @typedef {'OVERLOAD' | 'OPTIMAL' | 'LOW_LOAD'} CognitiveStateWire */

/** Theme tokens aligned with mobile ConceptExploreScreen. */
export const THEMES = {
  struggling: {
    pageBg: '#0D1B2A',
    cardBg: '#1B2A3B',
    headerBg: '#0D1B2A',
    accentBg: '#112233',
    headingColor: '#E8F4FD',
    bodyColor: '#C8DCF0',
    mutedColor: '#6A8FAA',
    accentColor: '#38BDF8',
    badgeBg: '#0E3A52',
    badgeText: '#38BDF8',
    pillBg: '#112233',
    pillBorder: '#1E3A50',
    ctaBg: '#0C4A6E',
    ctaShadow: '#38BDF8',
    tierBorderColor: '#EF4444',
    mascot: '🌙',
    mascotBg: '#0E3A52',
    greeting: 'Take it easy. One step at a time.',
    modeName: 'Calm Mode',
    modeSubtitle: 'Simplified just for you',
    kwBg: '#0E3A5240',
    kwBorder: '#38BDF840',
    kwText: '#38BDF8',
    headerBorder: 'rgba(232,244,253,0.08)',
  },
  focused: {
    pageBg: '#F0F4FF',
    cardBg: '#FFFFFF',
    headerBg: '#FFFFFF',
    accentBg: '#EEF2FF',
    headingColor: '#1E1B4B',
    bodyColor: '#312E81',
    mutedColor: '#7C86A1',
    accentColor: '#4F46E5',
    badgeBg: '#EEF2FF',
    badgeText: '#4F46E5',
    pillBg: '#F8FAFF',
    pillBorder: '#C7D2FE',
    ctaBg: '#4F46E5',
    ctaShadow: '#4F46E5',
    tierBorderColor: '#22C55E',
    mascot: '🔬',
    mascotBg: '#EEF2FF',
    greeting: "You're in the zone. Let's learn!",
    modeName: 'Focus Mode',
    modeSubtitle: 'Optimized for your flow',
    kwBg: '#EEF2FF',
    kwBorder: '#C7D2FE',
    kwText: '#4F46E5',
    headerBorder: 'rgba(0,0,0,0.07)',
  },
  explorer: {
    pageBg: '#FFFBEB',
    cardBg: '#FFFFFF',
    headerBg: '#FFFFFF',
    accentBg: '#FEF3C7',
    headingColor: '#1C1917',
    bodyColor: '#292524',
    mutedColor: '#A8A29E',
    accentColor: '#F59E0B',
    badgeBg: '#FEF3C7',
    badgeText: '#D97706',
    pillBg: '#FFFBEB',
    pillBorder: '#FDE68A',
    ctaBg: '#F59E0B',
    ctaShadow: '#F59E0B',
    tierBorderColor: '#F59E0B',
    mascot: '🧭',
    mascotBg: '#FEF3C7',
    greeting: "Ready to explore? Let's go deeper!",
    modeName: 'Adventure Mode',
    modeSubtitle: 'Enriched for curious minds',
    kwBg: '#FEF3C740',
    kwBorder: '#FDE68A',
    kwText: '#D97706',
    headerBorder: 'rgba(0,0,0,0.07)',
  },
}

/** @param {string | undefined} cognitiveState */
export function deriveProfile(cognitiveState) {
  const s = String(cognitiveState ?? 'OPTIMAL').toUpperCase()
  if (s.includes('OVER')) return { type: 'struggling', theme: THEMES.struggling }
  if (s.includes('LOW')) return { type: 'explorer', theme: THEMES.explorer }
  return { type: 'focused', theme: THEMES.focused }
}

/** Normalize API / document shapes into one transmute view model. */
export function normalizeTransmutePayload(raw) {
  if (!raw || typeof raw !== 'object') return null
  const keywords = raw.keywords_preserved ?? raw.output?.keywords_preserved
  return {
    original_complexity_score:
      raw.original_complexity_score ?? raw.output?.original_complexity_score,
    flesch_kincaid_grade: raw.flesch_kincaid_grade ?? raw.output?.flesch_kincaid_grade,
    dependency_distance: raw.dependency_distance ?? raw.output?.dependency_distance,
    keywords_preserved: Array.isArray(keywords) ? keywords : [],
    transmuted_text:
      raw.transmuted_text ??
      raw.output?.transmuted_text ??
      raw.output?.text ??
      '',
    tier_applied: raw.tier_applied ?? raw.output?.tier_applied ?? raw.tier ?? '',
    cognitive_state: raw.cognitive_state ?? raw.input?.cognitive_state,
  }
}

/** Map arbitrary strings to layout branch keys. */
export function cognitiveStateForLayout(routeState, parsed) {
  const fromParsed = String(parsed?.cognitive_state ?? '').toUpperCase()
  const fromRoute = String(routeState ?? '').toUpperCase()
  const s = fromRoute || fromParsed || 'OPTIMAL'
  if (s.includes('OVER')) return 'OVERLOAD'
  if (s.includes('LOW')) return 'LOW_LOAD'
  return 'OPTIMAL'
}
