'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import Card from '@/components/Card'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { apiFetch } from '@/lib/api'

export default function AdminUsersPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState(null)
  const [error, setError] = useState('')
  const [busyUid, setBusyUid] = useState(null)

  useEffect(() => {
    if (loading) return
    if (!profile) {
      router.replace('/login')
      return
    }
    if (profile.role !== 'admin') {
      router.replace('/forbidden')
      return
    }
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, profile, router])

  function refresh() {
    apiFetch('/admin/users').then(setUsers).catch((e) => setError(e.message))
  }

  async function handleRoleChange(uid, role) {
    setBusyUid(uid)
    try {
      await apiFetch(`/admin/users/${uid}/role`, { method: 'PATCH', body: JSON.stringify({ role }) })
      refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyUid(null)
    }
  }

  async function handleAssign(uid, counsellorId) {
    if (!counsellorId) return
    setBusyUid(uid)
    try {
      await apiFetch(`/admin/users/${uid}/assign-counsellor`, {
        method: 'PATCH',
        body: JSON.stringify({ counsellorId }),
      })
      refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyUid(null)
    }
  }

  if (loading || !profile) return null

  const counsellors = users?.filter((u) => u.role === 'counsellor') || []

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl text-bone mb-1">Users</h1>
        <p className="text-ash mb-8">
          Set roles and assign students to a counsellor. No individual journal or career content shown here.
        </p>

        {error && <p className="text-risk mb-6">{error}</p>}

        {users === null ? (
          <p className="text-ash">Loading…</p>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <Card key={u.uid} className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-bone font-medium">{u.name}</p>
                  <p className="text-ash text-sm">{u.email}</p>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={u.role}
                    disabled={busyUid === u.uid}
                    onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                    className="bg-ink border border-border rounded-lg px-3 py-1.5 text-sm text-bone"
                  >
                    <option value="student">student</option>
                    <option value="counsellor">counsellor</option>
                    <option value="admin">admin</option>
                  </select>

                  {u.role === 'student' && (
                    <select
                      value={u.counsellorId || ''}
                      disabled={busyUid === u.uid}
                      onChange={(e) => handleAssign(u.uid, e.target.value)}
                      className="bg-ink border border-border rounded-lg px-3 py-1.5 text-sm text-bone"
                    >
                      <option value="">No counsellor</option>
                      {counsellors.map((c) => (
                        <option key={c.uid} value={c.uid}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
