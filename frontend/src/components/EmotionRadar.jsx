'use client'

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

export default function EmotionRadar({ emotions, height = 260 }) {
  const top5 = Object.entries(emotions || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([emotion, score]) => ({
      emotion,
      score: Math.round(score * 100),
    }))

  if (top5.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={top5} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="#2B2F39" />
        <PolarAngleAxis
          dataKey="emotion"
          tick={{ fill: '#93979F', fontSize: 12 }}
        />
        <Radar
          name="score"
          dataKey="score"
          stroke="#5FA39B"
          fill="#5FA39B"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{
            background: '#1D2027',
            border: '1px solid #2B2F39',
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: '#ECE9E2', marginBottom: 4 }}
          itemStyle={{ color: '#5FA39B' }}
          formatter={(v) => [`${v}%`, 'score']}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
