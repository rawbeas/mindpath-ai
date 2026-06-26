'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'

import Card from '@/components/Card'
import GoogleIcon from '@/components/GoogleIcon'
import { dashboardPathForRole } from '@/contexts/AuthContext'
import { auth, googleProvider } from '@/lib/firebase'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

/**
 * Gets the token directly from the sign-in credential and calls
 * the backend WITHOUT going through apiFetch. This avoids the race
 * condition where auth.currentUser hasn't updated yet.
 */
async function fetchMeWithToken(firebaseUser) {
  const token = await firebaseUser.getIdToken(true)
  const res = await fetch(`${API_BASE}/users/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    let detail = `Backend returned ${res.status}`
    try {
      const body = await res.json()
      detail = body.detail || detail
    } catch { /* ignore */ }
    throw new Error(detail)
  }
  return res.json()
}

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [busy, setBusy]         = useState(false)
  const router = useRouter()

  async function handleEmailSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      const me = await fetchMeWithToken(credential.user)
      router.replace(dashboardPathForRole(me.role))
    } catch (err) {
      setError(err.message || 'Could not sign in. Check your email and password.')
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogleSignIn() {
    setError('')
    setBusy(true)
    try {
      const credential = await signInWithPopup(auth, googleProvider)
      const me = await fetchMeWithToken(credential.user)
      router.replace(dashboardPathForRole(me.role))
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || "Couldn't sign in with Google.")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <h1 className="font-display text-2xl text-bone mb-1">Sign in</h1>
        <p className="text-ash text-sm mb-6">Welcome back.</p>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={busy}
          className="w-full flex items-center justify-center gap-3 border border-border rounded-lg py-2.5 text-bone hover:bg-surface-hover disabled:opacity-50 transition-colors mb-5"
        >
          <GoogleIcon className="w-4 h-4" />
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-ash">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-ink border border-border rounded-lg px-4 py-2.5 text-bone placeholder:text-ash/60 focus:border-wellness outline-none"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-ink border border-border rounded-lg px-4 py-2.5 text-bone placeholder:text-ash/60 focus:border-wellness outline-none"
          />
          {error && <p className="text-risk text-sm break-words">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-wellness text-ink rounded-lg py-2.5 font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-ash text-sm mt-6 text-center">
          New here?{' '}
          <a href="/register" className="text-wellness hover:underline">
            Create an account
          </a>
        </p>
      </Card>
    </main>
  )
}
