import Link from 'next/link'

export default function ForbiddenPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-6xl text-border mb-4">403</p>
      <h1 className="font-display text-2xl text-bone mb-2">Access denied</h1>
      <p className="text-ash text-sm mb-8 max-w-sm">
        You don't have permission to view this page. If you think this is a mistake,
        ask an admin to check your role.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-lg border border-border text-bone hover:bg-surface transition-colors"
      >
        Go home
      </Link>
    </main>
  )
}
