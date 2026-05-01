import { getApiBase, getAccessToken, isMockMode } from '@/lib/api-client'
import { delay } from '@/lib/mock-data'

export async function analyzeNoteImage(file) {
  if (isMockMode()) {
    await delay(500)
    return { text: 'Mock OCR output:\n• Variable resistance\n• ΔV = IR\n• Review sensory cues.' }
  }
  const base = getApiBase()
  const token = getAccessToken()
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(`${base}/api/vision/notes/analyze`, {
    method: 'POST',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  })
  const raw = await res.text()
  let parsed
  try {
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    parsed = { raw }
  }
  if (!res.ok) {
    const err = new Error(parsed?.detail ?? parsed?.message ?? res.statusText)
    err.body = parsed
    throw err
  }
  return parsed
}
