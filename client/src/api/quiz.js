import { apiFetch, isMockMode } from '@/lib/api-client'
import { mockQuizResults, mockQuizTake, delay } from '@/lib/mock-data'

function listFromResponse(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.results)) return data.results
  return []
}

export async function fetchQuizResults() {
  if (isMockMode()) {
    await delay(300)
    return mockQuizResults
  }
  const data = await apiFetch('/api/quizzes/results')
  return listFromResponse(data)
}

export async function generateQuiz(lessonId) {
  if (isMockMode()) {
    await delay(500)
    return mockQuizTake.quiz
  }
  return apiFetch('/api/quizzes/generate', {
    method: 'POST',
    body: JSON.stringify({ lesson_id: lessonId }),
  })
}

export async function fetchQuiz(quizId) {
  if (isMockMode()) {
    await delay(200)
    return mockQuizTake.quiz
  }
  return apiFetch(`/api/quizzes/${quizId}`)
}

export async function submitQuiz(quizId, payload) {
  if (isMockMode()) {
    await delay(400)
    return mockQuizTake.result
  }
  return apiFetch(`/api/quizzes/${quizId}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchQuizResultsForQuiz(quizId) {
  if (isMockMode()) {
    await delay(250)
    return mockQuizTake.result
  }
  return apiFetch(`/api/quizzes/${quizId}/results`)
}
