import { getApiBase, getAccessToken, isMockMode } from '@/lib/api-client'
import { delay } from '@/lib/mock-data'

export async function synthesizeTts(text, speechRate = 'normal') {
  if (isMockMode()) {
    await delay(300)
    return null
  }
  const base = getApiBase()
  const token = getAccessToken()
  const res = await fetch(`${base}/api/tts/synthesize`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ text, speech_rate: speechRate }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(errText || res.statusText)
  }
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

export async function fetchVoiceCloneHealth() {
  if (isMockMode()) {
    await delay(150)
    return { status: 'ok' }
  }
  const base = getApiBase()
  const res = await fetch(`${base}/tts/health`, { credentials: 'include' })
  return res.json()
}

/** FormData with fields: text, language (optional), speaker_wav (File) */
export async function voiceCloneSynthesize(formData) {
  if (isMockMode()) {
    await delay(500)
    return null
  }
  const base = getApiBase()
  const token = getAccessToken()
  const res = await fetch(`${base}/tts/voice-clone`, {
    method: 'POST',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (!res.ok) {
    throw new Error(await res.text())
  }
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}
