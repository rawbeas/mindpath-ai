'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import Card from '@/components/Card'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { apiFetch } from '@/lib/api'

export default function InterviewPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const { id } = useParams()

  const [analysis, setAnalysis] = useState(null)
  const [current, setCurrent] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sessionScores, setSessionScores] = useState([])

  useEffect(() => {
    if (loading) return
    if (!profile) { router.replace('/login'); return }
    if (profile.role !== 'student') { router.replace('/forbidden'); return }
    apiFetch(`/career/results/${id}`).then(setAnalysis).catch((e) => setError(e.message))
  }, [loading, profile, router, id])

  const questions = analysis?.interviewQuestions || []
  const question = questions[current]
  const isLast = current === questions.length - 1
  const done = current >= questions.length

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const fb = await apiFetch('/career/interview/feedback', {
        method: 'POST',
        body: JSON.stringify({ analysisId: id, question, answer }),
      })
      setFeedback(fb)
      setSessionScores((prev) => [...prev, fb.score])
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function handleNext() {
    setAnswer('')
    setFeedback(null)
    setCurrent((c) => c + 1)
  }

  if (loading || !profile) return null

  const avgScore = sessionScores.length
    ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length)
    : null

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-10">
        {error && <p className="text-risk mb-6">{error}</p>}

        {!analysis ? (
          <p className="text-ash">Loading…</p>
        ) : done ? (
          // ── Session complete summary ──────────────────────────────
          <Card className="text-center py-10">
            <p className="text-ash text-sm mb-2">Session complete</p>
            <p className="font-display text-4xl text-bone mb-1">{avgScore ?? '—'}</p>
            <p className="text-ash text-sm mb-6">average score across {sessionScores.length} question{sessionScores.length !== 1 ? 's' : ''}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => { setCurrent(0); setSessionScores([]); setFeedback(null); setAnswer('') }}
                className="px-5 py-2.5 rounded-lg border border-border text-bone text-sm hover:bg-surface-hover transition-colors"
              >
                Start over
              </button>
              <Link
                href={`/results/${id}`}
                className="px-5 py-2.5 rounded-lg bg-career text-ink text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Back to results
              </Link>
            </div>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-display text-2xl text-bone">Mock interview</h1>
                <p className="text-ash text-sm">{analysis.jobTitle} · {analysis.companyName}</p>
              </div>
              <span className="text-xs font-mono text-ash bg-surface border border-border rounded-full px-3 py-1">
                {current + 1} / {questions.length}
              </span>
            </div>

            <Card className="mb-5">
              <p className="text-bone">{question}</p>
            </Card>

            {!feedback ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                  required
                  minLength={20}
                  rows={6}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here…"
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-bone placeholder:text-ash/60 focus:border-career outline-none resize-none"
                />
                <button
                  type="submit"
                  disabled={busy || answer.trim().length < 20}
                  className="px-6 py-2.5 rounded-lg bg-career text-ink font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {busy ? 'Getting feedback…' : 'Submit answer'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <Card className="border-wellness/30">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-ash">Score</p>
                    <span className={`text-xl font-mono font-medium ${
                      feedback.score >= 70 ? 'text-stable' : feedback.score >= 45 ? 'text-career' : 'text-risk'
                    }`}>{feedback.score}/100</span>
                  </div>
                  <p className="text-bone text-sm">{feedback.feedback}</p>
                </Card>

                <Card>
                  <p className="text-xs text-ash mb-2">Improved answer</p>
                  <p className="text-bone text-sm">{feedback.improved}</p>
                </Card>

                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-lg bg-career text-ink font-medium hover:opacity-90 transition-opacity"
                >
                  {isLast ? 'See session summary' : 'Next question →'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}
