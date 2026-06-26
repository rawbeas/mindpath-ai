'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import Card from '@/components/Card'
import EmotionBars from '@/components/EmotionBars'
import EmotionTrend from '@/components/EmotionTrend'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { apiFetch } from '@/lib/api'

export default function StudentDashboard() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [journalEntries, setJournalEntries] = useState(null)
  const [careerHistory, setCareerHistory] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading) return
    if (!profile) { router.replace('/login'); return }
    if (profile.role !== 'student') { router.replace('/forbidden'); return }
    apiFetch('/journal/history').then(setJournalEntries).catch((e) => setError(e.message))
    apiFetch('/career/history').then(setCareerHistory).catch(() => {})
  }, [loading, profile, router])

  if (loading || !profile) return null

  const today = new Date().toDateString()
  const wroteToday = journalEntries?.some(
    (e) => new Date(e.createdAt).toDateString() === today
  )
  const latestJournal = journalEntries?.[0]
  const bestScore = careerHistory?.length
    ? Math.max(...careerHistory.map((c) => c.gapScore))
    : null
  const latestCareer = careerHistory?.[0]

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl text-bone mb-1">
          Hey {profile.name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-ash mb-8">Here's where things stand.</p>

        {error && <p className="text-risk mb-6">{error}</p>}

        {/* ── stat strip ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Analyses run',
              value: careerHistory?.length ?? '—',
              sub: 'career sessions',
            },
            {
              label: 'Best gap score',
              value: bestScore != null ? `${bestScore}%` : '—',
              sub: latestCareer ? `${latestCareer.jobTitle} @ ${latestCareer.companyName}` : 'no analyses yet',
            },
            {
              label: 'Journal entries',
              value: journalEntries?.length ?? '—',
              sub: 'total written',
            },
            {
              label: 'Wrote today',
              value: wroteToday ? 'Yes' : 'Not yet',
              sub: wroteToday ? 'keep it up' : 'write an entry',
            },
          ].map((s) => (
            <Card key={s.label}>
              <p className="text-xs text-ash mb-1">{s.label}</p>
              <p className="text-2xl font-display text-bone">{s.value}</p>
              <p className="text-xs text-ash/70 mt-0.5 truncate">{s.sub}</p>
            </Card>
          ))}
        </div>

        {/* ── two-column content cards ────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Career card */}
          <Card className={latestCareer ? 'border-career/30' : ''}>
            <h2 className="font-display text-lg text-bone mb-2">
              {latestCareer
                ? `Last analysis — ${latestCareer.jobTitle} @ ${latestCareer.companyName}`
                : 'Career coaching'}
            </h2>
            {latestCareer ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-career rounded-full"
                      style={{ width: `${latestCareer.gapScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono text-career">{latestCareer.gapScore}%</span>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/results/${latestCareer.id}`}
                    className="text-sm text-career hover:underline"
                  >
                    View full result →
                  </Link>
                  <Link href="/analyze" className="text-sm text-ash hover:underline">
                    New analysis
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-ash text-sm mb-4">
                  Upload your resume and paste a job description to see how well you match.
                </p>
                <Link
                  href="/analyze"
                  className="inline-block px-5 py-2.5 rounded-lg bg-career text-ink font-medium hover:opacity-90 transition-opacity"
                >
                  Analyse your resume
                </Link>
              </>
            )}
          </Card>

          {/* Wellness card */}
          <Card className={!wroteToday ? 'border-wellness/30' : ''}>
            <h2 className="font-display text-lg text-bone mb-2">
              Wellbeing — last entry
            </h2>
            {journalEntries === null ? (
              <p className="text-ash text-sm">Loading…</p>
            ) : latestJournal ? (
              <>
                <p className="text-bone text-sm mb-3">{latestJournal.insight}</p>
                <EmotionBars emotions={latestJournal.emotions} count={4} />
                {journalEntries.length >= 2 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-ash mb-2">Last {Math.min(journalEntries.length, 7)} entries</p>
                    <EmotionTrend entries={journalEntries.slice(0, 7)} />
                  </div>
                )}
                {!wroteToday && (
                  <div className="mt-4">
                    <Link
                      href="/journal"
                      className="inline-block px-5 py-2 rounded-lg bg-wellness text-ink text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      Write today's entry
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-ash text-sm mb-4">
                  No entries yet — write your first one to start tracking how you're doing.
                </p>
                <Link
                  href="/journal"
                  className="inline-block px-5 py-2.5 rounded-lg bg-wellness text-ink font-medium hover:opacity-90 transition-opacity"
                >
                  Write today's entry
                </Link>
              </>
            )}
          </Card>
        </div>

        {/* counsellor info strip */}
        {profile.counsellorId && (
          <p className="text-xs text-ash mt-6 border border-border rounded-lg px-4 py-3">
            You have an assigned counsellor. Your journal entries are shared with them privately — they can't see any career data.
          </p>
        )}
      </main>
    </>
  )
}
