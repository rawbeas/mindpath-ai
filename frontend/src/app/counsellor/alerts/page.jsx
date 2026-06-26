'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import Card from '@/components/Card'
import EmotionBars from '@/components/EmotionBars'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { apiFetch } from '@/lib/api'

export default function CounsellorAlertsPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [alerts, setAlerts] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    apiFetch('/counsellor/alerts').then(setAlerts).catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    if (loading) return
    if (!profile) { router.replace('/login'); return }
    if (profile.role !== 'counsellor') { router.replace('/forbidden'); return }
    load()
    const id = setInterval(load, 20000)
    return () => clearInterval(id)
  }, [loading, profile, router, load])

  if (loading || !profile) return null

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-bone">Alerts</h1>
            <p className="text-ash text-sm mt-1">
              Entries where grief + fear + sadness exceeded the threshold. Refreshes every 20 seconds.
            </p>
          </div>
          {alerts?.length > 0 && (
            <span className="bg-risk-soft text-risk text-xs font-medium px-3 py-1 rounded-full border border-risk/30">
              {alerts.length} flagged
            </span>
          )}
        </div>

        {error && <p className="text-risk mb-6">{error}</p>}

        {alerts === null ? (
          <p className="text-ash">Loading…</p>
        ) : alerts.length === 0 ? (
          <Card>
            <p className="text-stable font-medium mb-1">All clear</p>
            <p className="text-ash text-sm">No flagged entries right now.</p>
          </Card>
        ) : (
          <div className="space-y-5">
            {alerts.map((entry) => (
              <Card key={entry.id} className="border-risk/40">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-xs font-mono text-ash">
                      {new Date(entry.createdAt).toLocaleString(undefined, {
                        dateStyle: 'medium', timeStyle: 'short',
                      })}
                    </p>
                    <p className="text-xs text-risk mt-0.5">
                      risk score {Math.round(entry.riskScore * 100)}%
                    </p>
                  </div>
                  <Link
                    href={`/counsellor/student/${entry.userId}`}
                    className="text-xs text-wellness hover:underline whitespace-nowrap"
                  >
                    View student →
                  </Link>
                </div>

                <p className="text-bone text-sm mb-4 line-clamp-3">{entry.text}</p>
                <EmotionBars emotions={entry.emotions} count={5} />

                {entry.counsellorSummary && (
                  <p className="text-wellness text-sm mt-4 italic border-t border-border pt-3">
                    {entry.counsellorSummary}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
