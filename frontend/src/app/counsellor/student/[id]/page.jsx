'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

import Card from '@/components/Card'
import EmotionBars from '@/components/EmotionBars'
import EmotionTrend from '@/components/EmotionTrend'
import RiskBadge from '@/components/RiskBadge'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { apiFetch } from '@/lib/api'

export default function StudentJournalPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const studentId = params.id

  const [entries, setEntries] = useState(null)
  const [error, setError] = useState('')
  const [noteDrafts, setNoteDrafts] = useState({})
  const [savingNote, setSavingNote] = useState(null)

  useEffect(() => {
    if (loading) return
    if (!profile) {
      router.replace('/login')
      return
    }
    if (profile.role !== 'counsellor') {
      router.replace('/forbidden')
      return
    }
    apiFetch(`/counsellor/students/${studentId}/journal`).then(setEntries).catch((e) => setError(e.message))
  }, [loading, profile, router, studentId])

  async function handleAddNote(entryId) {
    const note = (noteDrafts[entryId] || '').trim()
    if (!note) return
    setSavingNote(entryId)
    try {
      await apiFetch(`/counsellor/entries/${entryId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      })
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId
            ? {
                ...e,
                counsellorNotes: [
                  ...e.counsellorNotes,
                  { note, addedBy: profile.uid, addedAt: new Date().toISOString() },
                ],
              }
            : e
        )
      )
      setNoteDrafts((prev) => ({ ...prev, [entryId]: '' }))
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingNote(null)
    }
  }

  if (loading || !profile) return null

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl text-bone mb-8">Journal entries</h1>

        {error && <p className="text-risk mb-6">{error}</p>}

        {entries === null ? (
          <p className="text-ash">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-ash">No entries from this student yet.</p>
        ) : (
          <div className="space-y-6">
            {entries.length >= 2 && (
              <Card className="border-wellness/30">
                <h2 className="font-display text-lg text-bone mb-4">Emotion trend</h2>
                <EmotionTrend entries={entries} />
              </Card>
            )}
            {entries.map((entry) => (
              <Card key={entry.id}>
                <div className="flex items-start justify-between mb-3 gap-4">
                  <span className="text-xs font-mono text-ash">
                    {new Date(entry.createdAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                  <RiskBadge riskFlag={entry.riskFlag} riskScore={entry.riskScore} />
                </div>

                <p className="text-bone text-sm mb-4">{entry.text}</p>
                <EmotionBars emotions={entry.emotions} count={10} />

                {entry.counsellorSummary && (
                  <p className="text-wellness text-sm mt-4 italic">{entry.counsellorSummary}</p>
                )}

                <div className="mt-5 pt-5 border-t border-border">
                  <p className="text-xs text-ash mb-2">Private notes — only counsellors can see these</p>
                  {entry.counsellorNotes.map((n, i) => (
                    <p key={i} className="text-sm text-bone bg-ink/50 rounded-lg px-3 py-2 mb-2">
                      {n.note}
                    </p>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <input
                      value={noteDrafts[entry.id] || ''}
                      onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                      placeholder="Add a note only you and other counsellors can see"
                      className="flex-1 bg-ink border border-border rounded-lg px-3 py-2 text-sm text-bone placeholder:text-ash/60 focus:border-wellness outline-none"
                    />
                    <button
                      onClick={() => handleAddNote(entry.id)}
                      disabled={savingNote === entry.id}
                      className="px-4 py-2 rounded-lg bg-surface-hover text-bone text-sm hover:bg-border transition-colors disabled:opacity-50"
                    >
                      {savingNote === entry.id ? 'Saving…' : 'Add'}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
