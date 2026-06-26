export default function RiskBadge({ riskFlag, riskScore = 0 }) {
  if (riskFlag) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-risk-soft text-risk whitespace-nowrap">
        High risk
      </span>
    )
  }
  if (riskScore > 0.4) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-career-soft text-career whitespace-nowrap">
        Watch
      </span>
    )
  }
  return (
    <span className="px-3 py-1 rounded-full text-xs font-medium bg-stable-soft text-stable whitespace-nowrap">
      Stable
    </span>
  )
}
