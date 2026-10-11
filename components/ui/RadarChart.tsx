// @ts-nocheck
'use client'

import { useMemo } from 'react'
import type { PillarName, PillarScores } from '@/types'
import { CORE_PILLAR_ORDER, PILLAR_DISPLAY_NAMES } from '@/types'
import { scoreToRadarPoint } from '@/lib/utils'

interface RadarChartProps {
  scores: Partial<PillarScores>
  previousScores?: Partial<PillarScores>
  size?: number
  showLabels?: boolean
  showIdeal?: boolean
  animated?: boolean
  pillars?: PillarName[]
}

// The eight core covenant-formation pillars, in display order. `cross_pillar`
// is deliberately excluded — it isn't one of the eight spokes of the profile.
const GRID_LEVELS = [20, 40, 60, 80, 100]

export function RadarChart({
  scores,
  previousScores,
  size = 360,
  showLabels = true,
  showIdeal = true,
  animated = true,
  pillars = CORE_PILLAR_ORDER,
}: RadarChartProps) {
  const PILLARS = pillars
  const cx = size / 2
  const cy = size / 2
  const maxRadius = (size / 2) * 0.7
  const labelRadius = (size / 2) * 0.88

  const angleStep = (2 * Math.PI) / PILLARS.length

  const angles = useMemo(
    () => PILLARS.map((_, i) => i * angleStep - Math.PI / 2),
    [angleStep]
  )

  // Grid points for each level
  const gridPolygons = GRID_LEVELS.map(level =>
    angles.map(angle => {
      const r = (level / 100) * maxRadius
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      }
    })
  )

  // Current profile polygon
  const profilePoints = angles.map((angle, i) => {
    const score = scores[PILLARS[i]] || 0
    return scoreToRadarPoint(score, angle + Math.PI / 2, cx, cy, maxRadius)
  })

  // Previous profile polygon (for transformation overlay)
  const previousPoints = previousScores
    ? angles.map((angle, i) => {
        const score = previousScores[PILLARS[i]] || 0
        return scoreToRadarPoint(score, angle + Math.PI / 2, cx, cy, maxRadius)
      })
    : null

  // Label positions
  const labelPositions = angles.map((angle, i) => {
    const r = labelRadius
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      pillar: PILLARS[i],
      score: scores[PILLARS[i]] || 0,
      angle: (angle * 180) / Math.PI + 90,
    }
  })

  const toPolyPoints = (pts: { x: number; y: number }[]) =>
    pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="radar-chart"
      style={{ fontFamily: 'var(--font-display)' }}
    >
      {/* Grid */}
      {gridPolygons.map((pts, li) => (
        <polygon
          key={li}
          points={toPolyPoints(pts)}
          fill="none"
          stroke="rgba(184,151,42,0.08)"
          strokeWidth={1}
        />
      ))}

      {/* Axes */}
      {angles.map((angle, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={cx + maxRadius * Math.cos(angle)}
          y2={cy + maxRadius * Math.sin(angle)}
          stroke="rgba(184,151,42,0.1)"
          strokeWidth={1}
        />
      ))}

      {/* Ideal ring (100%) */}
      {showIdeal && (
        <polygon
          points={toPolyPoints(
            angles.map(angle => ({
              x: cx + maxRadius * Math.cos(angle),
              y: cy + maxRadius * Math.sin(angle),
            }))
          )}
          fill="rgba(184,151,42,0.04)"
          stroke="rgba(184,151,42,0.25)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
      )}

      {/* Previous profile (ghost) */}
      {previousPoints && (
        <polygon
          points={toPolyPoints(previousPoints)}
          fill="rgba(59,47,30,0.3)"
          stroke="rgba(184,151,42,0.2)"
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
      )}

      {/* Current profile */}
      <polygon
        points={toPolyPoints(profilePoints)}
        fill="rgba(184,151,42,0.12)"
        stroke="var(--gold)"
        strokeWidth={2}
        style={animated ? { animation: 'radarDraw 1.5s ease-out forwards' } : undefined}
      />

      {/* Data points */}
      {profilePoints.map((pt, i) => {
        const score = scores[PILLARS[i]] || 0
        let dotColor = '#B8972A'
        if (score >= 85) dotColor = '#2C5F2E'
        else if (score >= 70) dotColor = '#4A7A4A'
        else if (score < 30) dotColor = '#8B2020'
        else if (score < 50) dotColor = '#C47A1A'

        return (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={4}
            fill={dotColor}
            stroke="var(--bg-primary)"
            strokeWidth={1.5}
          />
        )
      })}

      {/* Labels */}
      {showLabels && labelPositions.map((pos, i) => {
        const score = pos.score
        const textAnchor =
          Math.abs(pos.x - cx) < 10 ? 'middle' : pos.x > cx ? 'start' : 'end'
        const dy = pos.y < cy ? -4 : 14

        return (
          <g key={i}>
            <text
              x={pos.x}
              y={pos.y}
              textAnchor={textAnchor}
              fontSize={10}
              fontWeight={600}
              fill="var(--text-secondary)"
              dy={dy}
            >
              {PILLAR_DISPLAY_NAMES[pos.pillar]}
            </text>
            <text
              x={pos.x}
              y={pos.y}
              textAnchor={textAnchor}
              fontSize={9}
              fill="var(--gold-muted)"
              dy={dy + 13}
            >
              {score > 0 ? Math.round(score) : '—'}
            </text>
          </g>
        )
      })}

      {/* Center label */}
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize={11}
        fontWeight={600}
        fill="var(--gold-muted)"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        ✦
      </text>
    </svg>
  )
}
