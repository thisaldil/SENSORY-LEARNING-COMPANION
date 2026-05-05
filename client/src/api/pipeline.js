import { apiFetch, isMockMode } from '@/lib/api-client'
import {
  delay,
  mockJobCompletedPayload,
  mockTransmuteResponse,
} from '@/lib/mock-data'

export async function startProcess(payload = {}) {
  if (isMockMode()) {
    await delay(300)
    const jobId = `mock-${Date.now()}`
    return { job_id: jobId, status: 'queued', ...payload }
  }
  return apiFetch('/api/process', {
    method: 'POST',
    skipAuthRetry: true,
    body: JSON.stringify(payload),
  })
}

export async function getProcessingStatus(jobId) {
  if (isMockMode()) {
    await delay(350)
    if (jobId?.startsWith?.('instant-')) {
      return mockJobCompletedPayload
    }
    const start = Number(jobId.replace(/\D/g, '').slice(0, 13))
    const elapsed = Number.isFinite(start) ? Date.now() - start : 99999
    if (elapsed < 2200) {
      return { status: 'processing', progress: Math.min(95, Math.floor(elapsed / 25)) }
    }
    return mockJobCompletedPayload
  }
  return apiFetch(`/api/status/${jobId}`)
}

export async function regenerateContent(payload = {}) {
  if (isMockMode()) {
    await delay(400)
    return { ok: true, message: 'Mock regenerate' }
  }
  return apiFetch('/api/regenerate', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function transmute(payload) {
  if (isMockMode()) {
    await delay(500)
    return {
      ...mockTransmuteResponse,
      transmuted_text: payload.text?.slice(0, 400) ?? mockTransmuteResponse.transmuted_text,
    }
  }
  return apiFetch('/api/v1/transmute', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchLatestTransmuted(studentId, lessonId) {
  const q = new URLSearchParams({ student_id: studentId })
  if (lessonId) q.set('lesson_id', lessonId)
  if (isMockMode()) {
    await delay(250)
    return {
      student_id: studentId,
      lesson_id: lessonId,
      output: { transmuted_text: mockTransmuteResponse.transmuted_text },
      input: { cognitive_state: 'OPTIMAL', raw_text: '' },
    }
  }
  return apiFetch(`/api/content/transmuted/latest?${q}`)
}
