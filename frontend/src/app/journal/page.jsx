'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import Card from '@/components/Card'
import EmotionRadar from '@/components/EmotionRadar'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { apiFetch } from '@/lib/api'

export default function JournalPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!profile) router.replace('/login')
    else if (profile.role !== 'student') router.replace('/forbidden')
  }, [loading, profile, router])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const entry = await apiFetch('/journal/submit', {
        method: 'POST',
        body: JSON.stringify({ text }),
      })
      setResult(entry)
      setText('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading || !profile) return null

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl text-bone mb-1">How are you feeling today?</h1>
        <p className="text-ash mb-8">
          Write freely — this is private by default. Your counsellor only sees it if something needs their
          attention.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            minLength={10}
            rows={8}
            placeholder="Today I..."
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-bone placeholder:text-ash/60 focus:border-wellness outline-none resize-none"
          />
          {error && <p className="text-risk text-sm">{error}</p>}
          <button
            type="submit"
            disabled={busy || text.trim().length < 10}
            className="px-6 py-2.5 rounded-lg bg-wellness text-ink font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {busy ? 'Saving…' : 'Save entry'}
          </button>
        </form>

        {result && (
          <Card className="mt-8 border-wellness/40">
            <p className="text-bone mb-4">{result.insight}</p>
            <EmotionRadar emotions={result.emotions} />
          </Card>
        )}
      </main>
    </>
  )
}
