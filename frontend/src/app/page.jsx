'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { dashboardPathForRole, useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && profile) {
      router.replace(dashboardPathForRole(profile.role))
    }
  }, [loading, profile, router])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="text-sm tracking-widest text-wellness uppercase mb-4">Career + wellness, one place</p>
      <h1 className="font-display text-5xl md:text-6xl text-bone mb-6 max-w-2xl">
        Mind<span className="text-career">Path</span> AI
      </h1>
      <p className="text-ash max-w-md mb-10">
        Track how you&apos;re doing, close the gap on your next job, and have a counsellor in your corner —
        without keeping the two separate.
      </p>
      <div className="flex gap-4">
        <Link
          href="/register"
          className="px-6 py-3 rounded-lg bg-wellness text-ink font-medium hover:opacity-90 transition-opacity"
        >
          Create account
        </Link>
        <Link
          href="/login"
          className="px-6 py-3 rounded-lg border border-border text-bone hover:bg-surface transition-colors"
        >
          Sign in
        </Link>
      </div>
    </main>
  )
}
