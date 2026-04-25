/**
 * Tests for the pure dashboard calculations extracted from
 * app/(app)/dashboard/page.tsx
 */
import { describe, it, expect } from 'vitest'

// Mirror the exact logic from the dashboard page
function collectionRate(collected: number, outstanding: number): number {
  const total = collected + outstanding
  return total > 0 ? Math.round((collected / total) * 100) : 0
}

function termLabel(settings: { currentTerm: string; currentYear: string } | null): string {
  return settings ? `${settings.currentTerm} — ${settings.currentYear}` : 'Term 1 — 2024'
}

describe('collectionRate', () => {
  it('returns 100 when everything is collected', () => {
    expect(collectionRate(5000, 0)).toBe(100)
  })

  it('returns 0 when nothing is collected', () => {
    expect(collectionRate(0, 5000)).toBe(0)
  })

  it('returns 0 when both are 0 (no division by zero)', () => {
    expect(collectionRate(0, 0)).toBe(0)
  })

  it('rounds to nearest integer', () => {
    expect(collectionRate(1, 2)).toBe(33) // 33.33... → 33
    expect(collectionRate(2, 1)).toBe(67) // 66.66... → 67
  })

  it('returns 50 for equal collected and outstanding', () => {
    expect(collectionRate(500, 500)).toBe(50)
  })

  it('returns correct rate for realistic school fee scenario', () => {
    // 37 students paid, 5 outstanding = 42 total students
    expect(collectionRate(33300, 4500)).toBe(88) // 33300/37800 ≈ 88%
  })
})

describe('termLabel', () => {
  it('formats the label from settings', () => {
    expect(termLabel({ currentTerm: 'Term 2', currentYear: '2024/2025' }))
      .toBe('Term 2 — 2024/2025')
  })

  it('returns fallback when settings is null', () => {
    expect(termLabel(null)).toBe('Term 1 — 2024')
  })
})
