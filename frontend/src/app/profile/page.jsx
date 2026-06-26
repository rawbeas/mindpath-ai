'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth'

import Card from '@/components/Card'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { apiFetch } from '@/lib/api'
import { auth } from '@/lib/firebase'

export default function ProfilePage() {
  const { profile, loading, signOut } = useAuth()
  const router = useRouter()

  const [name, setName] = useState('')
  const [nameSuccess, setNameSuccess] = useState(false)
  const [nameBusy, setNameBusy] = useState(false)
  const [nameError, setNameError] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwBusy, setPwBusy] = useState(false)
  const [pwError, setPwError] = useState('')

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    if (loading) return
    if (!profile) { router.replace('/login'); return }
    setName(profile.name || '')
  }, [loading, profile, router])

  async function handleNameSave(e) {
    e.preventDefault()
    setNameError(''); setNameSuccess(false); setNameBusy(true)
    try {
      await apiFetch('/users/me', { method: 'PATCH', body: JSON.stringify({ name }) })
      setNameSuccess(true)
      setTimeout(() => setNameSuccess(false), 3000)
    } catch (err) {
      setNameError(err.message)
    } finally {
      setNameBusy(false)
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    setPwError(''); setPwSuccess(false); setPwBusy(true)
    try {
      const user = auth.currentUser
      // Google sign-in users have no password to change
      if (!user.providerData.some((p) => p.providerId === 'password')) {
        throw new Error('Your account uses Google sign-in — password changes are managed through Google.')
      }
      const cred = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, cred)
      await updatePassword(user, newPassword)
      setPwSuccess(true)
      setCurrentPassword(''); setNewPassword('')
      setTimeout(() => setPwSuccess(false), 3000)
    } catch (err) {
      setPwError(
        err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
          ? 'Current password is incorrect.'
          : err.message
      )
    } finally {
      setPwBusy(false)
    }
  }

  async function handleDelete(e) {
    e.preventDefault()
    if (deleteConfirm !== 'DELETE') {
      setDeleteError('Type DELETE exactly to confirm.')
      return
    }
    setDeleteBusy(true); setDeleteError('')
    try {
      // tell the backend to remove the Firestore profile + Firebase Auth account
      await apiFetch('/users/me', { method: 'DELETE' })
      await signOut()
      router.replace('/')
    } catch (err) {
      // if the backend deleted but client auth is still live, finish the client side
      try { await deleteUser(auth.currentUser) } catch {}
      setDeleteError(err.message)
      setDeleteBusy(false)
    }
  }

  if (loading || !profile) return null

  const isGoogleUser = auth.currentUser?.providerData?.some(
    (p) => p.providerId === 'google.com'
  )

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-6 py-10 space-y-6">
        <h1 className="font-display text-3xl text-bone">Profile & settings</h1>
        <p className="text-ash text-sm -mt-4">
          Role: <span className="text-bone capitalize">{profile.role}</span>
          {' · '}
          {profile.email}
        </p>

        {/* ── Name ─────────────────────────────────────────────── */}
        <Card>
          <h2 className="font-display text-lg text-bone mb-4">Display name</h2>
          <form onSubmit={handleNameSave} className="space-y-3">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-ink border border-border rounded-lg px-4 py-2.5 text-bone placeholder:text-ash/60 focus:border-wellness outline-none"
            />
            {nameError && <p className="text-risk text-sm">{nameError}</p>}
            {nameSuccess && <p className="text-stable text-sm">Name updated.</p>}
            <button
              type="submit"
              disabled={nameBusy}
              className="px-5 py-2 rounded-lg bg-wellness text-ink text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {nameBusy ? 'Saving…' : 'Save name'}
            </button>
          </form>
        </Card>

        {/* ── Password ─────────────────────────────────────────── */}
        <Card>
          <h2 className="font-display text-lg text-bone mb-1">Change password</h2>
          {isGoogleUser ? (
            <p className="text-ash text-sm mt-2">
              Your account uses Google sign-in — passwords are managed by Google.
            </p>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-3 mt-4">
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full bg-ink border border-border rounded-lg px-4 py-2.5 text-bone placeholder:text-ash/60 focus:border-wellness outline-none"
              />
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 6 characters)"
                className="w-full bg-ink border border-border rounded-lg px-4 py-2.5 text-bone placeholder:text-ash/60 focus:border-wellness outline-none"
              />
              {pwError && <p className="text-risk text-sm">{pwError}</p>}
              {pwSuccess && <p className="text-stable text-sm">Password updated.</p>}
              <button
                type="submit"
                disabled={pwBusy}
                className="px-5 py-2 rounded-lg bg-wellness text-ink text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {pwBusy ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}
        </Card>

        {/* ── Delete account ───────────────────────────────────── */}
        <Card className="border-risk/30">
          <h2 className="font-display text-lg text-bone mb-1">Delete account</h2>
          <p className="text-ash text-sm mb-4">
            Permanently removes your account. Your journal entries and analyses are anonymised
            but not deleted (for audit purposes). This cannot be undone.
          </p>
          <form onSubmit={handleDelete} className="space-y-3">
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder='Type DELETE to confirm'
              className="w-full bg-ink border border-risk/40 rounded-lg px-4 py-2.5 text-bone placeholder:text-ash/60 focus:border-risk outline-none"
            />
            {deleteError && <p className="text-risk text-sm">{deleteError}</p>}
            <button
              type="submit"
              disabled={deleteBusy || deleteConfirm !== 'DELETE'}
              className="px-5 py-2 rounded-lg bg-risk-soft border border-risk/40 text-risk text-sm font-medium hover:bg-risk/20 disabled:opacity-40 transition-colors"
            >
              {deleteBusy ? 'Deleting…' : 'Delete my account'}
            </button>
          </form>
        </Card>
      </main>
    </>
  )
}
