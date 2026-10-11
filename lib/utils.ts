// @ts-nocheck
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { type FormationDescriptor, type PillarName, DESCRIPTOR_THRESHOLDS, DESCRIPTOR_COLORS } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDescriptorFromScore(score: number): FormationDescriptor {
  if (score >= 85) return 'christformed'
  if (score >= 70) return 'rooted'
  if (score >= 50) return 'growing'
  if (score >= 30) return 'awakening'
  return 'unengaged'
}

export function getDescriptorColor(descriptor: FormationDescriptor): string {
  return DESCRIPTOR_COLORS[descriptor]
}

export function formatScore(score: number): string {
  return Math.round(score).toString()
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function getDaysRemaining(targetDate: string): number {
  const now = new Date()
  const target = new Date(targetDate)
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function getPhaseProgress(startDate: string, targetEndDate: string): number {
  const start = new Date(startDate).getTime()
  const end = new Date(targetEndDate).getTime()
  const now = Date.now()
  const progress = ((now - start) / (end - start)) * 100
  return Math.min(100, Math.max(0, progress))
}

export function getPillarEmoji(pillar: PillarName): string {
  const map: Record<PillarName, string> = {
    humility:    '⬇',
    integrity:   '◈',
    compassion:  '◉',
    courage:     '▲',
    purity:      '◇',
    servanthood: '◎',
    wisdom:      '✦',
    cross_pillar: '⊕',
  }
  return map[pillar]
}

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generateSessionToken(): string {
  return crypto.randomUUID()
}

// Converts a score 0-100 to a radar chart coordinate
export function scoreToRadarPoint(
  score: number,
  angle: number,
  cx: number,
  cy: number,
  maxRadius: number
): { x: number; y: number } {
  const r = (score / 100) * maxRadius
  return {
    x: cx + r * Math.cos(angle - Math.PI / 2),
    y: cy + r * Math.sin(angle - Math.PI / 2),
  }
}
