import { apiFetch, isMockMode } from '@/lib/api-client'
import { mockAnimationResponse, delay } from '@/lib/mock-data'

export async function fetchDebugTestGeneration() {
  if (isMockMode()) {
    await delay(200)
    return {
      status: 'ok',
      client_initialized: true,
      provider: 'mock',
      model: 'mock-model',
      api_key_set: false,
    }
  }
  return apiFetch('/api/debug/test-generation')
}

export async function generateAnimation(concept, mode = 'hybrid') {
  if (isMockMode()) {
    await delay(450)
    return {
      ...mockAnimationResponse,
      concept: (concept || 'demo').toLowerCase(),
    }
  }
  const qs = mode ? `?mode=${encodeURIComponent(mode)}` : ''
  return apiFetch(`/api/animation/generate${qs}`, {
    method: 'POST',
    body: JSON.stringify({ concept: concept || 'Learning concept' }),
  })
}

export async function generateNeuroAdaptiveAnimation(payload) {
  if (isMockMode()) {
    await delay(500)
    return {
      ...mockAnimationResponse,
      cognitive_state: payload.cognitive_state ?? 'OPTIMAL',
      tier: 'T2',
      source: 'neuro_adaptive_rule_based',
      concept: payload.concept ?? 'Adaptive',
    }
  }
  return apiFetch('/api/animation/neuro-adaptive', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchNeuroAdaptiveLatest(studentId, sessionId) {
  const q = new URLSearchParams({ student_id: studentId })
  if (sessionId) q.set('session_id', sessionId)
  if (isMockMode()) {
    await delay(300)
    return {
      ...mockAnimationResponse,
      source: 'neuro_adaptive_logged',
      student_id: studentId,
      session_id: sessionId,
    }
  }
  return apiFetch(`/api/animation/neuro-adaptive/latest?${q}`)
}
