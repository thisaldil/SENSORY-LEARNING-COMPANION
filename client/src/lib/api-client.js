import { STORAGE_ACCESS } from '@/lib/constants'

const BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''

export function getApiBase() {
  return BASE
}

export function getAccessToken() {
  return sessionStorage.getItem(STORAGE_ACCESS)
}

export function setAccessToken(token) {
  if (token) sessionStorage.setItem(STORAGE_ACCESS, token)
  else sessionStorage.removeItem(STORAGE_ACCESS)
}

function authHeaders() {
  const t = getAccessToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

let refreshPromise = null

async function postRefresh() {
  const url = `${BASE}/api/auth/refresh`
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) return null
  const data = await res.json().catch(() => null)
  const access =
    data?.access_token ?? data?.accessToken ?? data?.token ?? null
  if (access) setAccessToken(access)
  return access
}

async function ensureRefreshed() {
  if (!refreshPromise) {
    refreshPromise = postRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

/**
 * Fetch JSON from EduSense API. Sends credentials for httpOnly refresh cookie.
 * Retries once after POST /api/auth/refresh on 401.
 */
export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`
  const { parseJson = true, skipAuthRetry = false, ...init } = options
  const isFormData =
    typeof FormData !== 'undefined' && init.body instanceof FormData
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...authHeaders(),
    ...init.headers,
  }

  let res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers,
  })

  if (
    res.status === 401 &&
    !skipAuthRetry &&
    !path.includes('/api/auth/refresh') &&
    !path.includes('/api/auth/login')
  ) {
    const ok = await ensureRefreshed()
    if (ok) {
      res = await fetch(url, {
        ...init,
        credentials: 'include',
        headers: {
          ...headers,
          ...authHeaders(),
        },
      })
    }
  }

  if (!parseJson) return res

  const text = await res.text()
  let body = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = { raw: text }
    }
  }
  if (!res.ok) {
    const err = new Error(body?.detail ?? body?.message ?? res.statusText)
    err.status = res.status
    err.body = body
    throw err
  }
  return body
}

export function isMockMode() {
  return (
    import.meta.env.VITE_USE_MOCK === 'true' ||
    import.meta.env.VITE_USE_MOCK === '1' ||
    BASE === ''
  )
}
