'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import Card from '@/components/Card'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { apiFetch } from '@/lib/api'

function StatCard({ label, value, sub, accent }) {
  const colours = {
    career: 'text-career',
    wellness: 'text-wellness',
    risk: 'text-risk',
    default: 'text-bone',
  }
  return (
    <Card>
      <p className="text-xs text-ash mb-1">{label}</p>
      <p className={`text-3xl font-display ${colours[accent] || colours.default}`}>{value}</p>
      {sub && <p className="text-xs text-ash/70 mt-0.5">{sub}</p>}
    </Card>
  )
}

export default function AdminDashboard() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading) return
    if (!profile) { router.replace('/login'); return }
    if (profile.role !== 'admin') { router.replace('/forbidden'); return }
    apiFetch('/admin/stats').then(setStats).catch((e) => setError(e.message))
  }, [loading, profile, router])

  if (loading || !profile) return null

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl text-bone mb-1">Platform overview</h1>
        <p className="text-ash mb-8">Aggregate numbers only — no individual content is visible here.</p>

        {error && <p className="text-risk mb-6">{error}</p>}

        {!stats ? (
          <p className="text-ash">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total users"        value={stats.totalUsers}         sub={`${stats.students} students`} />
              <StatCard label="Counsellors"         value={stats.counsellors}        sub={`avg ${stats.avgCounsellorLoad} students each`} accent="wellness" />
              <StatCard label="Journal entries"    value={stats.totalJournalEntries} sub="all time" accent="wellness" />
              <StatCard label="Flagged entries"    value={stats.flaggedEntries}      sub="high distress" accent="risk" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <StatCard label="Resume analyses"   value={stats.totalAnalyses}  sub="career pipeline" accent="career" />
              <StatCard label="Admins"            value={stats.admins}         sub="including you" />
            </div>

            <div className="flex gap-4">
              <Link
                href="/admin/analytics"
                className="px-5 py-2.5 rounded-lg bg-wellness text-ink font-medium hover:opacity-90 transition-opacity"
              >
                View analytics charts →
              </Link>
              <Link
                href="/admin/users"
                className="px-5 py-2.5 rounded-lg border border-border text-bone hover:bg-surface-hover transition-colors"
              >
                Manage users
              </Link>
            </div>
          </>
        )}
      </main>
    </>
  )
}
