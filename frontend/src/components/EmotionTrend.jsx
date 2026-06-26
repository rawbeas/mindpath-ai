'use client'

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const EMOTION_COLOURS = {
  joy:         '#84A873',
  gratitude:   '#84A873',
  excitement:  '#5FA39B',
  sadness:     '#7B93C4',
  grief:       '#9B7EC8',
  fear:        '#D9614D',
  anger:       '#C45A5A',
  anxiety:     '#DB9255',
  nervousness: '#C4A35A',
  neutral:     '#93979F',
}

function shortDate(raw) {
  try {
    return new Date(raw).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return '—'
  }
}

export default function EmotionTrend({ entries }) {
  // need at least 2 points to draw a line
  if (!entries || entries.length < 2) return null

  // entries come newest-first from the API — reverse for left→right chronology
  const chronological = [...entries].reverse()

  // find the 5 emotions with the highest average score across all entries
  const sums = {}
  chronological.forEach((e) => {
    Object.entries(e.emotions || {}).forEach(([em, score]) => {
      sums[em] = (sums[em] || 0) + score
    })
  })
  const top5 = Object.entries(sums)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([em]) => em)

  const data = chronological.map((e) => ({
    date: shortDate(e.createdAt),
    ...Object.fromEntries(
      top5.map((em) => [em, Math.round((e.emotions?.[em] || 0) * 100)])
    ),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2B2F39" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#93979F', fontSize: 11 }}
          axisLine={{ stroke: '#2B2F39' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#93979F', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          domain={[0, 100]}
          unit="%"
        />
        <Tooltip
          contentStyle={{
            background: '#1D2027',
            border: '1px solid #2B2F39',
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: '#ECE9E2', marginBottom: 4 }}
          formatter={(v, name) => [`${v}%`, name]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: '#93979F', paddingTop: 8 }}
        />
        {top5.map((em) => (
          <Line
            key={em}
            type="monotone"
            dataKey={em}
            stroke={EMOTION_COLOURS[em] || '#93979F'}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
