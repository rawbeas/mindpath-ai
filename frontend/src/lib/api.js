import { auth } from './firebase'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

/**
 * Every protected read/write goes through this. The frontend never
 * talks to Firestore directly for app data - only FastAPI does, which
 * is what keeps the student/counsellor privacy split enforceable.
 */
export async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }

  const user = auth.currentUser
  if (user) {
    const token = await user.getIdToken()
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    let detail = `Request failed (${res.status})`
    try {
      const body = await res.json()
      detail = body.detail || detail
    } catch {
      // response wasn't JSON - keep the generic message
    }
    throw new Error(detail)
  }

  if (res.status === 204) return null
  return res.json()
}
