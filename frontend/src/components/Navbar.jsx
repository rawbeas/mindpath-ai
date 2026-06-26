'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { dashboardPathForRole, useAuth } from '@/contexts/AuthContext'

const LINKS = {
  student: [
    { href: '/dashboard',       label: 'Dashboard' },
    { href: '/analyze',         label: 'Resume' },
    { href: '/career-history',  label: 'Career history' },
    { href: '/journal',         label: 'Write' },
    { href: '/journal/history', label: 'Journal history' },
  ],
  counsellor: [
    { href: '/counsellor/dashboard', label: 'My students' },
    { href: '/counsellor/alerts',    label: 'Alerts' },
  ],
  admin: [
    { href: '/admin/dashboard',  label: 'Overview' },
    { href: '/admin/users',      label: 'Users' },
    { href: '/admin/analytics',  label: 'Analytics' },
  ],
}

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const pathname = usePathname()
  const links = profile ? LINKS[profile.role] || [] : []

  return (
    <nav className="border-b border-border bg-ink/95 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href={profile ? dashboardPathForRole(profile.role) : '/'}
          className="font-display text-lg tracking-wide text-bone shrink-0"
        >
          Mind<span className="text-career">Path</span>{' '}
          <span className="text-wellness">AI</span>
        </Link>

        <div className="flex items-center gap-1 overflow-x-auto">
          {links.map((l) => {
            const active = pathname === l.href
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-surface text-bone'
                    : 'text-ash hover:text-bone hover:bg-surface/60'
                }`}
              >
                {l.label}
              </Link>
            )
          })}

          {profile && (
            <>
              <Link
                href="/profile"
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                  pathname === '/profile'
                    ? 'bg-surface text-bone'
                    : 'text-ash hover:text-bone hover:bg-surface/60'
                }`}
              >
                Profile
              </Link>
              <button
                onClick={signOut}
                className="ml-2 text-sm text-ash hover:text-risk transition-colors whitespace-nowrap"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
