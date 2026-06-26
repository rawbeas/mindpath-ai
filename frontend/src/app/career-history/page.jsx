'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import Card from '@/components/Card'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { apiFetch } from '@/lib/api'

function ScoreBar({ score }) {
  const colour = score >= 70 ? 'bg-stable' : score >= 45 ? 'bg-career' : 'bg-risk'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colour}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-mono text-ash w-8 text-right">{score}</span>
    </div>
  )
}

export default function CareerHistoryPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading) return
    if (!profile) { router.replace('/login'); return }
    if (profile.role !== 'student') { router.replace('/forbidden'); return }
    apiFetch('/career/history').then(setItems).catch((e) => setError(e.message))
  }, [loading, profile, router])

  if (loading || !profile) return null

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl text-bone">Career history</h1>
          <Link
            href="/analyze"
            className="px-5 py-2 rounded-lg bg-career text-ink text-sm font-medium hover:opacity-90 transition-opacity"
          >
            New analysis
          </Link>
        </div>

        {error && <p className="text-risk mb-6">{error}</p>}

        {items === null ? (
          <p className="text-ash">Loading…</p>
        ) : items.length === 0 ? (
          <Card>
            <p className="text-ash text-sm mb-4">No analyses yet.</p>
            <Link href="/analyze" className="text-career hover:underline text-sm">
              Run your first one →
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Link key={item.id} href={`/results/${item.id}`}>
                <Card className="hover:border-career/50 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="text-bone font-medium">{item.jobTitle}</p>
                      <p className="text-ash text-sm">{item.companyName}</p>
                    </div>
                    <span className="text-xs font-mono text-ash/60 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </span>
                  </div>
                  <ScoreBar score={item.gapScore} />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
