'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import Card from '@/components/Card'
import EmotionBars from '@/components/EmotionBars'
import EmotionTrend from '@/components/EmotionTrend'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { apiFetch } from '@/lib/api'

export default function HistoryPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [entries, setEntries] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading) return
    if (!profile) {
      router.replace('/login')
      return
    }
    if (profile.role !== 'student') {
      router.replace('/forbidden')
      return
    }
    apiFetch('/journal/history').then(setEntries).catch((e) => setError(e.message))
  }, [loading, profile, router])

  async function handleDelete(id) {
    if (!confirm("Delete this entry? This can't be undone.")) return
    await apiFetch(`/journal/${id}`, { method: 'DELETE' })
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  if (loading || !profile) return null

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl text-bone mb-8">Your entries</h1>

        {error && <p className="text-risk mb-6">{error}</p>}

        {entries === null ? (
          <p className="text-ash">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-ash">
            No entries yet —{' '}
            <a href="/journal" className="text-wellness hover:underline">
              write your first one
            </a>
            .
          </p>
        ) : (
          <div className="space-y-4">
            {entries.length >= 2 && (
              <Card className="mb-2">
                <h2 className="font-display text-lg text-bone mb-4">Emotion trend</h2>
                <EmotionTrend entries={entries} />
              </Card>
            )}
            {entries.map((entry) => (
              <Card key={entry.id}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-mono text-ash">
                    {new Date(entry.createdAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-xs text-ash hover:text-risk transition-colors"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-bone text-sm mb-4">{entry.text}</p>
                <p className="text-ash text-sm mb-3 italic">{entry.insight}</p>
                <EmotionBars emotions={entry.emotions} count={3} />
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
