export default function EmotionBars({ emotions, count = 5 }) {
  const sorted = Object.entries(emotions || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)

  if (sorted.length === 0) return null

  return (
    <div className="space-y-3">
      {sorted.map(([label, score]) => (
        <div key={label} className="flex items-center gap-3">
          <span className="w-28 text-sm text-ash capitalize shrink-0">{label}</span>
          <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
            <div className="h-full bg-wellness rounded-full" style={{ width: `${Math.round(score * 100)}%` }} />
          </div>
          <span className="w-12 text-right text-xs font-mono text-ash shrink-0">{Math.round(score * 100)}%</span>
        </div>
      ))}
    </div>
  )
}
