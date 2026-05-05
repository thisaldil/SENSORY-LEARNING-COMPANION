import { apiFetch, isMockMode } from '@/lib/api-client'
import { mockLessons, mockProgress, delay } from '@/lib/mock-data'

function listFromResponse(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.results)) return data.results
  return []
}

export async function fetchLessons() {
  if (isMockMode()) {
    await delay(350)
    return mockLessons
  }
  const data = await apiFetch('/api/lessons')
  return listFromResponse(data)
}

export async function fetchLesson(id) {
  if (isMockMode()) {
    await delay(200)
    const lesson = mockLessons.find((l) => l.id === id)
    if (!lesson) throw new Error('Lesson not found')
    return {
      ...lesson,
      activities: [
        { id: 'a1', title: 'Visual script review', type: 'visual' },
        { id: 'a2', title: 'Haptic calibration', type: 'haptic' },
      ],
    }
  }
  return apiFetch(`/api/lessons/${id}`)
}

export async function fetchLessonActivities(id) {
  if (isMockMode()) {
    await delay(200)
    return [
      { id: 'a1', title: 'Tier 3 bullets → animation', type: 'generation' },
      { id: 'a2', title: 'Sensory overlay', type: 'sensory' },
    ]
  }
  return apiFetch(`/api/lessons/${id}/activities`)
}

export { fetchQuizResults } from '@/api/quiz'

export async function fetchMyProgress() {
  if (isMockMode()) {
    await delay(280)
    return mockProgress
  }
  return apiFetch('/api/progress/me')
}

export async function createLesson(payload) {
  if (isMockMode()) {
    await delay(350)
    return {
      id: `les-${Date.now()}`,
      title: payload.title,
      description: payload.description ?? '',
      updated_at: new Date().toISOString(),
    }
  }
  return apiFetch('/api/lessons', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
