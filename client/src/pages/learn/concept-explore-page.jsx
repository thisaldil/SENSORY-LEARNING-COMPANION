import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
} from 'lucide-react'
import {
  cognitiveStateForLayout,
  deriveProfile,
  normalizeTransmutePayload,
} from '@/lib/concept-explore-themes'

function FadeBlock({ children, delayMs = 0, className = '' }) {
  return (
    <div
      className={`concept-fade-in ${className}`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  )
}

function MascotPulse({ emoji, bg, profileType }) {
  const pulseClass =
    profileType === 'explorer' ? 'concept-mascot-pulse-explorer'
    : profileType === 'focused' ? 'concept-mascot-pulse-focused'
    : 'concept-mascot-pulse-struggling'
  return (
    <div
      className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full text-[28px] leading-none ${pulseClass}`}
      style={{ backgroundColor: bg }}
    >
      <span aria-hidden>{emoji}</span>
    </div>
  )
}

function MetricPill({ label, value, theme }) {
  return (
    <div
      className="flex min-w-0 flex-1 flex-col items-center rounded-xl border py-2.5"
      style={{
        backgroundColor: theme.pillBg,
        borderColor: theme.pillBorder,
      }}
    >
      <span
        className="mb-0.5 text-[9px] font-extrabold tracking-wide uppercase"
        style={{ color: theme.mutedColor }}
      >
        {label}
      </span>
      <span className="text-[13px] font-extrabold" style={{ color: theme.accentColor }}>
        {value}
      </span>
    </div>
  )
}

function CalmStepCards({ text, theme }) {
  const lines = text
    .split(/\n+/)
    .map((l) => l.replace(/^[*\-•]\s*/, '').trim())
    .filter(Boolean)

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <MascotPulse emoji={theme.mascot} bg={theme.mascotBg} profileType="struggling" />
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-extrabold tracking-wide" style={{ color: theme.headingColor }}>
            {theme.modeName}
          </p>
          <p className="mt-0.5 text-xs leading-4" style={{ color: theme.mutedColor }}>
            {theme.greeting}
          </p>
        </div>
      </div>
      {lines.length > 0 ?
        lines.map((line, i) => (
          <FadeBlock key={i} delayMs={i * 120} className="mb-2.5">
            <div
              className="flex gap-3 rounded-2xl border p-4"
              style={{
                backgroundColor: theme.accentBg,
                borderColor: theme.pillBorder,
              }}
            >
              <div
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-black text-white"
                style={{ backgroundColor: theme.accentColor }}
              >
                {i + 1}
              </div>
              <p className="flex-1 text-[19px] leading-7 font-semibold" style={{ color: theme.bodyColor }}>
                {line}
              </p>
            </div>
          </FadeBlock>
        ))
      : (
        <p className="text-[19px] leading-7 font-semibold" style={{ color: theme.bodyColor }}>
          {text}
        </p>
      )}
    </div>
  )
}

function StructuredLessonPanel({ text, keywords, theme }) {
  return (
    <div>
      <div className="mb-3.5 flex items-center gap-2.5">
        <span className="text-[30px] leading-none" aria-hidden>
          {theme.mascot}
        </span>
        <div>
          <p className="text-[17px] font-extrabold" style={{ color: theme.headingColor }}>
            {theme.modeName}
          </p>
          <p className="mt-px text-xs" style={{ color: theme.mutedColor }}>
            {theme.greeting}
          </p>
        </div>
      </div>
      <div className="mb-4 h-px" style={{ backgroundColor: theme.pillBorder }} />
      <FadeBlock delayMs={80}>
        <p className="mb-2.5 text-[13px] font-extrabold tracking-wide uppercase" style={{ color: theme.accentColor }}>
          📖 Lesson explanation
        </p>
        <p className="mb-4 text-[15px] leading-[25px] font-medium" style={{ color: theme.bodyColor }}>
          {text}
        </p>
      </FadeBlock>
      {keywords && keywords.length > 0 && (
        <FadeBlock delayMs={200}>
          <div
            className="rounded-[14px] border p-3.5"
            style={{
              backgroundColor: theme.accentBg,
              borderColor: theme.pillBorder,
            }}
          >
            <p className="mb-2.5 text-xs font-extrabold tracking-wide uppercase" style={{ color: theme.accentColor }}>
              🔑 Key vocabulary
            </p>
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="rounded-full border px-2.5 py-1 text-xs font-bold"
                  style={{
                    backgroundColor: theme.cardBg,
                    borderColor: theme.pillBorder,
                    color: theme.bodyColor,
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </FadeBlock>
      )}
    </div>
  )
}

function AdventureStoryView({ text, theme }) {
  const parts = text.split(/\n+/).map((p) => p.trim()).filter(Boolean)
  const paragraphs =
    parts.length > 1 ? parts : (
      text.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()).filter(Boolean) ?? [text]
    )

  return (
    <div>
      <div className="mb-[18px] flex flex-wrap items-center gap-2.5">
        <MascotPulse emoji={theme.mascot} bg={theme.mascotBg} profileType="explorer" />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-black" style={{ color: theme.headingColor }}>
            {theme.modeName}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: theme.mutedColor }}>
            {theme.greeting}
          </p>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-black tracking-wide"
          style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
        >
          ⚡ ENRICHED
        </span>
      </div>
      {paragraphs.map((para, i) => (
        <FadeBlock key={i} delayMs={i * 100} className="mb-2.5">
          <div
            className="rounded-[14px] border border-l-4 p-3.5"
            style={{
              backgroundColor: i % 2 === 0 ? theme.cardBg : theme.accentBg,
              borderColor: theme.pillBorder,
              borderLeftColor: theme.accentColor,
            }}
          >
            <p className="text-[15px] leading-6 font-medium" style={{ color: theme.bodyColor }}>
              {para}
            </p>
          </div>
        </FadeBlock>
      ))}
    </div>
  )
}

function LayoutFactory({ cognitiveState, parsed, theme }) {
  const safeText =
    parsed?.transmuted_text?.trim() ||
    'No transmuted text found. Try generating the lesson again once the Neuro-Engine has processed your lesson.'

  switch (cognitiveState) {
    case 'OVERLOAD':
      return <CalmStepCards text={safeText} theme={theme} />
    case 'LOW_LOAD':
      return <AdventureStoryView text={safeText} theme={theme} />
    case 'OPTIMAL':
    default:
      return (
        <StructuredLessonPanel
          text={safeText}
          keywords={parsed?.keywords_preserved}
          theme={theme}
        />
      )
  }
}

function TierBanner({ tier, theme }) {
  const color = theme.tierBorderColor
  return (
    <div
      className="mb-4 flex items-center gap-2 rounded-xl border-l-4 p-3 shadow-sm"
      style={{
        backgroundColor: theme.cardBg,
        borderLeftColor: color,
        boxShadow: `0 4px 12px ${color}18`,
      }}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      <span className="text-[13px] font-bold" style={{ color }}>
        {tier}
      </span>
    </div>
  )
}

function SectionLabel({ label, color }) {
  return (
    <p className="mb-2 text-[10px] font-black tracking-widest uppercase" style={{ color }}>
      {label}
    </p>
  )
}

export function ConceptExplorePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state ?? {}

  const [showRaw, setShowRaw] = useState(false)

  const parsed = useMemo(() => normalizeTransmutePayload(state.transmute), [state.transmute])

  const cognitiveLayout = useMemo(
    () => cognitiveStateForLayout(state.cognitiveState, parsed),
    [state.cognitiveState, parsed],
  )

  const profile = useMemo(
    () => deriveProfile(cognitiveLayout),
    [cognitiveLayout],
  )

  const { theme } = profile

  const goLearnRestore = (targetStep) => {
    navigate('/learn', { state: { restoreLearnFlow: true, targetStep } })
  }

  const goLessonPlayer = () => {
    const lid = state.lessonId
    if (lid) {
      navigate(`/learn/player?lesson_id=${encodeURIComponent(String(lid))}`, {
        state: { cognitiveState: cognitiveLayout },
      })
      return
    }
    goLearnRestore(2)
  }

  const demoEmoji =
    profile.type === 'struggling' ? '▶️'
    : profile.type === 'explorer' ? '🚀'
    : '🎮'

  const demoTitle =
    profile.type === 'struggling' ? 'See it visually'
    : profile.type === 'explorer' ? 'Launch animation!'
    : 'See it move!'

  const demoSub =
    profile.type === 'struggling' ? 'Watch a simple animation'
    : profile.type === 'explorer' ? 'Full interactive demo'
    : 'Play a quick demo'

  return (
    <div className="min-h-[calc(100svh-8rem)]" style={{ backgroundColor: theme.pageBg }}>
      <header
        className="flex items-center gap-2 px-4 pb-3.5 pt-2.5 md:px-6"
        style={{
          backgroundColor: theme.headerBg,
          borderBottomWidth: 1,
          borderBottomStyle: 'solid',
          borderBottomColor: theme.headerBorder,
        }}
      >
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-90"
          style={{ backgroundColor: theme.accentBg }}
          onClick={() => goLearnRestore(1)}
          aria-label="Back to processing"
        >
          <ChevronLeft className="h-5 w-5" style={{ color: theme.accentColor }} aria-hidden />
        </button>
        <div className="flex flex-1 flex-col items-center gap-1">
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide"
            style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
          >
            ⚡ Neuro-Engine result
          </span>
          <h1 className="text-center text-base font-black" style={{ color: theme.headingColor }}>
            Transmuted lesson
          </h1>
          <p className="text-center text-[11px] italic" style={{ color: theme.mutedColor }}>
            {theme.modeSubtitle}
          </p>
        </div>
        <div className="w-9 shrink-0" aria-hidden />
      </header>

      <div className="mx-auto max-w-xl px-4 pb-8 pt-4 md:px-6">
        {parsed?.tier_applied ?
          <FadeBlock delayMs={50}>
            <TierBanner tier={parsed.tier_applied} theme={theme} />
          </FadeBlock>
        : null}

        <FadeBlock delayMs={100} className="mb-4">
          <SectionLabel label="Transmuted output" color={theme.mutedColor} />
          <div
            className="rounded-[20px] border-[1.5px] p-[18px] shadow-md"
            style={{
              backgroundColor: theme.cardBg,
              borderColor: `${theme.accentColor}30`,
              boxShadow: `0 8px 24px ${theme.accentColor}14`,
            }}
          >
            <LayoutFactory cognitiveState={cognitiveLayout} parsed={parsed} theme={theme} />
          </div>
        </FadeBlock>

        {parsed ?
          <FadeBlock delayMs={200} className="mb-4">
            <SectionLabel label="NLP analysis metrics" color={theme.mutedColor} />
            <div className="flex gap-2">
              <MetricPill
                label="F-K grade"
                value={
                  parsed.flesch_kincaid_grade != null ?
                    `Grade ${Number(parsed.flesch_kincaid_grade).toFixed(1)}`
                  : '—'
                }
                theme={theme}
              />
              <MetricPill
                label="Complexity"
                value={
                  parsed.original_complexity_score != null ?
                    Number(parsed.original_complexity_score).toFixed(2)
                  : '—'
                }
                theme={theme}
              />
              <MetricPill
                label="Dep. distance"
                value={
                  parsed.dependency_distance != null ?
                    Number(parsed.dependency_distance).toFixed(2)
                  : '—'
                }
                theme={theme}
              />
            </div>
          </FadeBlock>
        : null}

        {parsed?.keywords_preserved?.length > 0 && (
          <FadeBlock delayMs={280} className="mb-4">
            <SectionLabel label="Keywords preserved" color={theme.mutedColor} />
            <div
              className="rounded-2xl border p-3.5"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.pillBorder,
              }}
            >
              <div className="mb-2.5 flex flex-wrap gap-2">
                {parsed.keywords_preserved.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full border px-2.5 py-1 text-xs font-bold"
                    style={{
                      backgroundColor: theme.kwBg,
                      borderColor: theme.kwBorder,
                      color: theme.kwText,
                    }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
              <p className="text-[11px] font-semibold" style={{ color: theme.mutedColor }}>
                {parsed.keywords_preserved.length} core terms preserved ✓
              </p>
            </div>
          </FadeBlock>
        )}

        <FadeBlock delayMs={340} className="mb-4">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 text-left"
            onClick={() => setShowRaw((v) => !v)}
          >
            <SectionLabel label="Raw input text" color={theme.mutedColor} />
            {showRaw ?
              <ChevronUp className="h-4 w-4 shrink-0" style={{ color: theme.mutedColor }} />
            : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: theme.mutedColor }} />}
          </button>
          {showRaw && (
            <div
              className="mt-2 rounded-[14px] border p-3.5"
              style={{
                backgroundColor: theme.accentBg,
                borderColor: theme.pillBorder,
              }}
            >
              <p className="text-[13px] leading-5" style={{ color: theme.mutedColor }}>
                {state.rawText?.trim() || 'No raw text available.'}
              </p>
            </div>
          )}
        </FadeBlock>

        <FadeBlock delayMs={400}>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-[22px] p-5 text-left shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99]"
            style={{
              backgroundColor: theme.ctaBg,
              boxShadow: `0 10px 28px ${theme.ctaShadow}55`,
            }}
            onClick={goLessonPlayer}
          >
            <div className="flex items-center gap-3.5">
              <span className="text-[32px] leading-none" aria-hidden>
                {demoEmoji}
              </span>
              <div>
                <p className="text-base font-black text-white">{demoTitle}</p>
                <p className="mt-px text-[11px] text-white/75">{demoSub}</p>
              </div>
            </div>
            <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-white/20">
              <ArrowRight className="h-[18px] w-[18px] text-white" aria-hidden />
            </span>
          </button>
        </FadeBlock>
      </div>
    </div>
  )
}
