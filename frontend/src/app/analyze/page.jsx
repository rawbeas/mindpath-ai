'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import Card from '@/components/Card'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { auth } from '@/lib/firebase'

const STEPS = ['Extracting text…', 'Scoring gap…', 'Analysing with AI…', 'Saving result…']

export default function AnalyzePage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const fileRef = useRef(null)

  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [file, setFile] = useState(null)
  const [step, setStep] = useState(-1)   // -1 = idle
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading) return
    if (!profile) router.replace('/login')
    else if (profile.role !== 'student') router.replace('/forbidden')
  }, [loading, profile, router])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setStep(0)

    try {
      const token = await auth.currentUser.getIdToken()

      const form = new FormData()
      form.append('resume', file)
      form.append('job_title', jobTitle)
      form.append('company_name', companyName)
      form.append('job_description', jobDescription)

      // Simulate step progression while the single request runs
      const ticker = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 3000)

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/career/analyze`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form }
      )
      clearInterval(ticker)

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || `Server error ${res.status}`)
      }
      const data = await res.json()
      router.push(`/results/${data.id}`)
    } catch (err) {
      setStep(-1)
      setError(err.message)
    }
  }

  if (loading || !profile) return null
  const busy = step >= 0

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl text-bone mb-1">Analyse your resume</h1>
        <p className="text-ash mb-8">
          Upload your resume PDF and paste the job description — we'll score the match,
          identify gaps, rewrite your weakest bullets, and generate 10 interview questions.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Card>
            <label className="block text-sm text-ash mb-2">Resume PDF</label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-lg px-6 py-8 text-center cursor-pointer transition-colors ${
                file ? 'border-career/60 bg-career-soft' : 'border-border hover:border-career/40'
              }`}
            >
              {file ? (
                <p className="text-career font-medium">{file.name}</p>
              ) : (
                <p className="text-ash">Click to choose a PDF (max 5 MB)</p>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-ash mb-1">Job title</label>
              <input
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. SDE II"
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-bone placeholder:text-ash/60 focus:border-career outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-ash mb-1">Company</label>
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Flipkart"
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-bone placeholder:text-ash/60 focus:border-career outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-ash mb-1">Job description</label>
            <textarea
              required
              minLength={50}
              rows={10}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here…"
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-bone placeholder:text-ash/60 focus:border-career outline-none resize-none"
            />
          </div>

          {error && <p className="text-risk text-sm">{error}</p>}

          {busy ? (
            <div className="space-y-2">
              {STEPS.map((label, i) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    i < step ? 'bg-stable' : i === step ? 'bg-career animate-pulse' : 'bg-border'
                  }`} />
                  <span className={`text-sm ${i <= step ? 'text-bone' : 'text-ash/50'}`}>{label}</span>
                </div>
              ))}
            </div>
          ) : (
            <button
              type="submit"
              disabled={!file}
              className="px-6 py-2.5 rounded-lg bg-career text-ink font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              Run analysis
            </button>
          )}
        </form>
      </main>
    </>
  )
}
