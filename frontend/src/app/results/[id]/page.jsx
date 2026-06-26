'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import Card from '@/components/Card'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { apiFetch } from '@/lib/api'

function ScoreRing({ score }) {
  const colour = score >= 70 ? '#84A873' : score >= 45 ? '#DB9255' : '#D9614D'
  const r = 40, circ = 2 * Math.PI * r
  const dash = (score / 100) * circ

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="104" height="104" viewBox="0 0 104 104">
        <circle cx="52" cy="52" r={r} fill="none" stroke="#2B2F39" strokeWidth="10" />
        <circle
          cx="52" cy="52" r={r} fill="none"
          stroke={colour} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 52 52)"
        />
        <text x="52" y="52" textAnchor="middle" dominantBaseline="central"
          className="font-mono" fill={colour} fontSize="22" fontWeight="600">
          {score}
        </text>
      </svg>
      <span className="text-xs text-ash">match score</span>
    </div>
  )
}

function Pill({ label, variant }) {
  const cls = variant === 'matched'
    ? 'bg-stable-soft text-stable border border-stable/30'
    : 'bg-risk-soft text-risk border border-risk/30'
  return <span className={`px-3 py-1 rounded-full text-xs font-medium ${cls}`}>{label}</span>
}

export default function ResultsPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const { id } = useParams()
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!profile) { router.replace('/login'); return }
    if (profile.role !== 'student') { router.replace('/forbidden'); return }
    apiFetch(`/career/results/${id}`).then(setResult).catch((e) => setError(e.message))
  }, [loading, profile, router, id])

  async function copyBullets() {
    await navigator.clipboard.writeText(result.rewrittenBullets.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading || !profile) return null

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-10">
        {error && <p className="text-risk mb-6">{error}</p>}
        {!result ? (
          <p className="text-ash">Loading…</p>
        ) : (
          <>
            <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
              <div>
                <h1 className="font-display text-3xl text-bone">{result.jobTitle}</h1>
                <p className="text-ash">{result.companyName}</p>
                <p className="text-xs font-mono text-ash/60 mt-1">
                  {new Date(result.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </p>
              </div>
              <ScoreRing score={result.gapScore} />
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <Card>
                <h2 className="font-display text-lg text-bone mb-3">Skills you already have</h2>
                <div className="flex flex-wrap gap-2">
                  {result.matchedSkills.length
                    ? result.matchedSkills.map((s) => <Pill key={s} label={s} variant="matched" />)
                    : <p className="text-ash text-sm">None detected — try adding more specifics to your resume.</p>
                  }
                </div>
              </Card>
              <Card>
                <h2 className="font-display text-lg text-bone mb-3">Gaps to close</h2>
                <div className="flex flex-wrap gap-2">
                  {result.missingSkills.length
                    ? result.missingSkills.map((s) => <Pill key={s} label={s} variant="missing" />)
                    : <p className="text-ash text-sm">No major gaps detected — nice.</p>
                  }
                </div>
              </Card>
            </div>

            <Card className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg text-bone">Rewritten bullets</h2>
                <button
                  onClick={copyBullets}
                  className="text-xs text-career hover:underline transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy all'}
                </button>
              </div>
              <ul className="space-y-3">
                {result.rewrittenBullets.map((b, i) => (
                  <li key={i} className="flex gap-3 text-sm text-bone">
                    <span className="text-career mt-0.5 flex-shrink-0">▸</span>
                    {b}
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <h2 className="font-display text-lg text-bone mb-3">10 likely interview questions</h2>
              <ol className="space-y-2 list-decimal list-inside">
                {result.interviewQuestions.map((q, i) => (
                  <li key={i} className="text-sm text-bone">{q}</li>
                ))}
              </ol>
              <div className="mt-5 pt-5 border-t border-border">
                <Link
                  href={`/interview/${result.id}`}
                  className="inline-block px-5 py-2.5 rounded-lg bg-career text-ink font-medium hover:opacity-90 transition-opacity"
                >
                  Practice these questions →
                </Link>
              </div>
            </Card>

            <div className="mt-6 flex gap-4">
              <Link href="/analyze" className="text-sm text-career hover:underline">
                ← Run another analysis
              </Link>
              <Link href="/career-history" className="text-sm text-ash hover:underline">
                View all past analyses
              </Link>
            </div>
          </>
        )}
      </main>
    </>
  )
}
