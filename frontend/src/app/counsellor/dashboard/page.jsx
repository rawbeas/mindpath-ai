'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import Card from '@/components/Card'
import RiskBadge from '@/components/RiskBadge'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { apiFetch } from '@/lib/api'

export default function CounsellorDashboard() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState(null)
  const [alertCount, setAlertCount] = useState(0)
  const [flaggedUids, setFlaggedUids] = useState(new Set())
  const [error, setError] = useState('')

  const loadAlerts = useCallback(() => {
    apiFetch('/counsellor/alerts')
      .then((alerts) => {
        setAlertCount(alerts.length)
        setFlaggedUids(new Set(alerts.map((a) => a.userId)))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (loading) return
    if (!profile) { router.replace('/login'); return }
    if (profile.role !== 'counsellor') { router.replace('/forbidden'); return }

    apiFetch('/counsellor/students').then(setStudents).catch((e) => setError(e.message))
    loadAlerts()
    const id = setInterval(loadAlerts, 20000)
    return () => clearInterval(id)
  }, [loading, profile, router, loadAlerts])

  if (loading || !profile) return null

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl text-bone">My students</h1>
            <p className="text-ash text-sm mt-1">Alerts refresh every 20 seconds.</p>
          </div>

          {alertCount > 0 && (
            <Link
              href="/counsellor/alerts"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-risk-soft border border-risk/40 text-risk text-sm font-medium hover:bg-risk/20 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-risk animate-pulse" />
              {alertCount} entr{alertCount === 1 ? 'y' : 'ies'} flagged — review now
            </Link>
          )}
        </div>

        {error && <p className="text-risk mb-6">{error}</p>}

        {students === null ? (
          <p className="text-ash">Loading…</p>
        ) : students.length === 0 ? (
          <Card>
            <p className="text-ash text-sm">
              No students assigned to you yet — an admin assigns students from the Users page.
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {students.map((s) => {
              const isFlagged = flaggedUids.has(s.uid)
              return (
                <Link key={s.uid} href={`/counsellor/student/${s.uid}`}>
                  <Card className="hover:border-wellness/50 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-bone font-medium">{s.name}</p>
                        <p className="text-ash text-sm">{s.email}</p>
                      </div>
                      <RiskBadge riskFlag={isFlagged} riskScore={isFlagged ? 0.8 : 0} />
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
