/** Infer display title + subject from raw lesson text (matches mobile NewLesson screen). */
export function inferLessonMetaFromText(content) {
  const trimmed = String(content ?? '').trim()
  if (!trimmed) {
    return { title: 'Lesson', subject: 'General' }
  }

  const firstLine = trimmed.split(/\r?\n/)[0] ?? trimmed
  const sentence = firstLine.split(/[.!?]/)[0] || firstLine
  const match =
    sentence.match(/^(.{0,80}?)(?:\s+is\b|\s+are\b|[:\-—])/i) ??
    sentence.match(/^(.{0,80}?)\b(using|about|for)\b/i)

  let raw = (match && match[1]) || sentence
  raw = raw.replace(/["“”]/g, '').trim()

  if (!raw || raw.length < 3) {
    return { title: 'Lesson', subject: 'General' }
  }

  const words = raw.split(/\s+/).slice(0, 6)
  const phrase = words.join(' ')
  const toTitleCase = (s) =>
    s
      .toLowerCase()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')

  const subject = toTitleCase(phrase)
  const title = subject
  return { title, subject }
}

/** Map predictor output to Adaptive Text Engine cognitive_state. */
export function predictStateToTransmute(state) {
  const s = String(state ?? '').toUpperCase()
  if (s.includes('LOW')) return 'LOW_LOAD'
  if (s.includes('OVER')) return 'OVERLOAD'
  return 'OPTIMAL'
}

/** Extract transmuted copy from transmute API response or TransmutedContent doc. */
export function extractTransmutedText(data) {
  if (!data) return ''
  return (
    data.transmuted_text ??
    data.output?.transmuted_text ??
    data.output?.text ??
    ''
  )
}
