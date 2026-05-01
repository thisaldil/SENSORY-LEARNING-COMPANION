import { apiFetch, isMockMode, setAccessToken } from '@/lib/api-client'
import {
  mockUserStudent,
  mockUserLecturer,
  mockUserAdmin,
  delay,
} from '@/lib/mock-data'
import { ROLES, STORAGE_MOCK_PROFILE } from '@/lib/constants'

function normalizeRole(raw) {
  const r = String(raw ?? '').toLowerCase()
  if (r === ROLES.LECTURER || r === ROLES.ADMIN || r === ROLES.STUDENT)
    return r
  return ROLES.STUDENT
}

export function normalizeUser(payload) {
  if (!payload) return null
  const role = normalizeRole(
    payload.role ?? payload.user_role ?? payload.userRole,
  )
  const full =
    payload.full_name ??
    payload.fullName ??
    [payload.first_name, payload.last_name].filter(Boolean).join(' ').trim()
  return {
    id: String(payload.id ?? payload.user_id ?? ''),
    email: payload.email ?? '',
    username: payload.username ?? '',
    full_name: full,
    first_name: payload.first_name ?? '',
    last_name: payload.last_name ?? '',
    role,
    raw: payload,
  }
}

/** Demo login — picks mock user by email keyword. */
export async function loginDemo(email, password) {
  await delay(350)
  void password
  const e = email.toLowerCase()
  let u = mockUserStudent
  if (e.includes('lecturer') || e.includes('patel')) u = mockUserLecturer
  if (e.includes('admin')) u = mockUserAdmin
  sessionStorage.setItem(STORAGE_MOCK_PROFILE, JSON.stringify(u))
  return {
    access_token: 'mock-access-token',
    user: u,
    refresh_token: 'mock-refresh',
  }
}

export async function loginRequest(email, password) {
  if (isMockMode()) {
    const data = await loginDemo(email, password)
    setAccessToken(data.access_token)
    return data
  }
  sessionStorage.removeItem(STORAGE_MOCK_PROFILE)
  const body = await apiFetch('/api/auth/login', {
    method: 'POST',
    skipAuthRetry: true,
    body: JSON.stringify({ email, password }),
  })
  const token =
    body.access_token ?? body.accessToken ?? body.token ?? null
  if (token) setAccessToken(token)
  return body
}

export async function registerRequest(payload) {
  if (isMockMode()) {
    await delay(400)
    const profile = {
      id: `user-${Date.now()}`,
      email: payload.email,
      username: payload.username,
      first_name: payload.first_name,
      last_name: payload.last_name,
      date_of_birth: payload.date_of_birth,
      gender: payload.gender ?? null,
      role: 'student',
    }
    sessionStorage.setItem(STORAGE_MOCK_PROFILE, JSON.stringify(profile))
    setAccessToken('mock-access-token')
    return profile
  }
  return apiFetch('/api/auth/register', {
    method: 'POST',
    skipAuthRetry: true,
    body: JSON.stringify(payload),
  })
}

export async function logoutRequest() {
  if (isMockMode()) {
    sessionStorage.removeItem(STORAGE_MOCK_PROFILE)
    setAccessToken(null)
    return
  }
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' })
  } finally {
    setAccessToken(null)
  }
}

export async function fetchMe() {
  if (isMockMode()) {
    await delay(250)
    const raw = sessionStorage.getItem(STORAGE_MOCK_PROFILE)
    const parsed = raw ? JSON.parse(raw) : mockUserStudent
    return normalizeUser(parsed)
  }
  const body = await apiFetch('/api/users/me')
  return normalizeUser(body)
}

export async function updateMe(payload) {
  if (isMockMode()) {
    await delay(300)
    const raw = sessionStorage.getItem(STORAGE_MOCK_PROFILE)
    const base = raw ? JSON.parse(raw) : mockUserStudent
    const merged = { ...base, ...payload }
    sessionStorage.setItem(STORAGE_MOCK_PROFILE, JSON.stringify(merged))
    return normalizeUser(merged)
  }
  const body = await apiFetch('/api/users/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return normalizeUser(body)
}

/** Maps React Hook Form values → FastAPI `UserSignup` body (snake_case). */
export function toSignupPayload(form) {
  const dob = String(form.date_of_birth ?? '').trim()
  const iso =
    dob.length === 10 && !dob.includes('T') ? `${dob}T00:00:00` : dob

  const body = {
    email: String(form.email ?? '').trim(),
    username: String(form.username ?? '').trim(),
    password: form.password,
    first_name: String(form.first_name ?? '').trim(),
    last_name: String(form.last_name ?? '').trim(),
    date_of_birth: iso,
  }

  const g = form.gender && String(form.gender).trim()
  if (g) body.gender = g

  return body
}

/** FastAPI often returns `detail` as string or validation array. */
export function formatAuthError(error) {
  const detail = error?.body?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item
        if (item?.msg) return item.msg
        return JSON.stringify(item)
      })
      .join(' ')
  }
  return error?.message ?? 'Request failed'
}
