import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-6xl text-border mb-4">404</p>
      <h1 className="font-display text-2xl text-bone mb-2">Page not found</h1>
      <p className="text-ash text-sm mb-8 max-w-sm">
        The page you're looking for doesn't exist, or has moved.
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
