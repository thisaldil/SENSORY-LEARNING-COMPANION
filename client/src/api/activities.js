import { apiFetch, isMockMode } from '@/lib/api-client'
import { mockGlobalActivities, delay } from '@/lib/mock-data'

function listFromResponse(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  return []
}

export async function fetchGlobalActivities() {
  if (isMockMode()) {
    await delay(280)
    return mockGlobalActivities
  }
  const data = await apiFetch('/api/activities')
  return listFromResponse(data)
}
