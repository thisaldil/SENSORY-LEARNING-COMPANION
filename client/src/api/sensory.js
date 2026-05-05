import { apiFetch, isMockMode } from '@/lib/api-client'
import { mockSensoryOverlay, delay } from '@/lib/mock-data'

export async function enrichScript(payload) {
  if (isMockMode()) {
    await delay(400)
    return payload.script
      ? { ...payload.script, meta: { ...(payload.script.meta || {}), enriched: true } }
      : {}
  }
  return apiFetch('/api/sensory/enrich-script', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function createSensoryOverlay(payload) {
  if (isMockMode()) {
    await delay(450)
    return mockSensoryOverlay
  }
  return apiFetch('/api/sensory/overlay', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
