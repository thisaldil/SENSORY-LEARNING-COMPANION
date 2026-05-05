import { apiFetch, isMockMode } from '@/lib/api-client'
import { delay } from '@/lib/mock-data'

export async function postCalibration(payload) {
  if (isMockMode()) {
    await delay(450)
    return { ok: true, baseline: 'OPTIMAL', message: 'Mock calibration saved' }
  }
  return apiFetch('/api/calibration', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function postPredict(payload) {
  if (isMockMode()) {
    await delay(350)
    return {
      state: 'OPTIMAL',
      confidence: 0.78,
      features: { avg_rt: 0.42, err_rate: 0.12 },
    }
  }
  return apiFetch('/api/v1/predict', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
