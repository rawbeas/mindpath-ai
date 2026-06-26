'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Cell,
} from 'recharts'

import Card from '@/components/Card'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { apiFetch } from '@/lib/api'

const EMOTION_COLOURS = {
  joy: '#84A873', gratitude: '#84A873', excitement: '#84A873',
  sadness: '#7B93C4', grief: '#7B93C4',
  fear: '#D9614D', anger: '#D9614D',
  anxiety: '#DB9255', nervousness: '#DB9255',
  neutral: '#93979F',
}

const GAP_COLOURS = {
  '0-29': '#D9614D',
  '30-49': '#DB9255',
  '50-69': '#ECE9E2',
  '70-84': '#84A873',
  '85-100': '#5FA39B',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 text-xs text-bone">
      <p className="font-medium capitalize mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.fill || p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed ? p.value.toFixed(3) : p.value : p.value}
        </p>
      ))}
    </div>
  )
}

export default function AdminAnalytics() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading) return
    if (!profile) { router.replace('/login'); return }
    if (profile.role !== 'admin') { router.replace('/forbidden'); return }
    apiFetch('/admin/analytics').then(setData).catch((e) => setError(e.message))
  }, [loading, profile, router])

  if (loading || !profile) return null

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl text-bone mb-1">Analytics</h1>
        <p className="text-ash mb-8">
          Aggregate platform data — no names, no individual content.
          Based on {data?.journalCount ?? '…'} journal entries.
        </p>

        {error && <p className="text-risk mb-6">{error}</p>}

        {!data ? (
          <p className="text-ash">Loading…</p>
        ) : (
          <div className="space-y-8">
            <Card>
              <h2 className="font-display text-lg text-bone mb-1">Average emotion scores across all entries</h2>
              <p className="text-ash text-sm mb-6">
                Average score per emotion — helps identify what students are experiencing platform-wide.
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.emotionTrends} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2B2F39" />
                  <XAxis
                    dataKey="emotion"
                    tick={{ fill: '#93979F', fontSize: 11 }}
                    axisLine={{ stroke: '#2B2F39' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#93979F', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 0.5]}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="avgScore" name="avg score" radius={[4, 4, 0, 0]}>
                    {data.emotionTrends.map((entry) => (
                      <Cell
                        key={entry.emotion}
                        fill={EMOTION_COLOURS[entry.emotion] || '#93979F'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <h2 className="font-display text-lg text-bone mb-1">Resume–job match score distribution</h2>
              <p className="text-ash text-sm mb-6">
                How well students' resumes match the jobs they're targeting.
              </p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.gapScoreDistribution} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2B2F39" />
                  <XAxis
                    dataKey="range"
                    tick={{ fill: '#93979F', fontSize: 12 }}
                    axisLine={{ stroke: '#2B2F39' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#93979F', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="count" name="analyses" radius={[4, 4, 0, 0]}>
                    {data.gapScoreDistribution.map((entry) => (
                      <Cell key={entry.range} fill={GAP_COLOURS[entry.range] || '#93979F'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}
      </main>
    </>
  )
}
