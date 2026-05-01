import { useCallback, useEffect, useState } from 'react'
import { fetchNeuroAdaptiveLatest, generateNeuroAdaptiveAnimation } from '@/api/visual'
import { fetchLatestTransmuted } from '@/api/pipeline'
import { extractTransmutedText } from '@/lib/learn-utils'
import { normalizeCognitiveWire } from '@/lib/lesson-player-utils'

function extractScriptPayload(res) {
  if (!res) return null
  return res.script ?? res.data?.script ?? null
}

function lessonIdsMatch(a, b) {
  if (a == null || b == null) return true
  return String(a) === String(b)
}

/**
 * Loads neuro-adaptive animation: reuse GET latest when it matches, else transmuted/latest + POST neuro-adaptive.
 */
export function useNeuroAdaptiveScript({
  lessonId,
  concept,
  studentId,
  sessionId,
  cognitiveState,
}) {
  const [script, setScript] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchScript = useCallback(async () => {
    if (!studentId) {
      setScript(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const latest = await fetchNeuroAdaptiveLatest(studentId, sessionId ?? undefined)
      const latestScript = extractScriptPayload(latest)
      const latestLesson = latest?.lesson_id ?? latest?.lessonId
      const latestCog = latest?.cognitive_state ?? latest?.cognitiveState
      const desiredWire = cognitiveState ? normalizeCognitiveWire(cognitiveState) : null

      if (latestScript) {
        const lessonOk = lessonIdsMatch(lessonId, latestLesson)
        const stateOk = !desiredWire || normalizeCognitiveWire(latestCog) === desiredWire
        if (lessonOk && stateOk) {
          setScript(latestScript)
          return
        }
      }

      const transmuted = await fetchLatestTransmuted(studentId, lessonId ?? undefined)
      const text = extractTransmutedText(transmuted)
      const inputState = transmuted?.input?.cognitive_state
      if (!text?.trim() || !inputState) {
        throw new Error(
          'No neuro-adaptive transmuted content found for this lesson. Complete processing in Learn flow first.',
        )
      }

      const resolvedWire =
        cognitiveState ? normalizeCognitiveWire(cognitiveState) : normalizeCognitiveWire(inputState)

      const animation = await generateNeuroAdaptiveAnimation({
        transmuted_text: text,
        cognitive_state: resolvedWire,
        concept:
          concept ||
          transmuted.topic ||
          transmuted.lesson_title ||
          transmuted.title ||
          'Lesson',
        student_id: studentId,
        lesson_id: lessonId ?? undefined,
        session_id: sessionId ?? undefined,
      })

      const animScript = extractScriptPayload(animation)
      setScript(animScript)
    } catch (err) {
      setError(err?.message ?? 'Unable to generate a visual explanation right now.')
      setScript(null)
    } finally {
      setLoading(false)
    }
  }, [lessonId, studentId, sessionId, concept, cognitiveState])

  useEffect(() => {
    queueMicrotask(() => {
      fetchScript()
    })
  }, [fetchScript])

  return { script, loading, error, refetch: fetchScript }
}
