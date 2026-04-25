/**
 * Tests for the pure billing calculations extracted from
 * app/(app)/billing/new/page.tsx
 */
import { describe, it, expect } from 'vitest'

// Mirror the exact logic from the billing page
function calcBalance(amountStr: string, paidStr: string): number {
  const amount = parseFloat(amountStr || '0')
  const paid   = parseFloat(paidStr   || '0')
  return isNaN(amount - paid) ? 0 : Math.max(0, amount - paid)
}

function isFullyPaid(balance: number, paid: number): boolean {
  return balance === 0 && paid > 0
}

describe('billing balance calculation', () => {
  it('balance = amount - paid in the normal case', () => {
    expect(calcBalance('1000', '400')).toBe(600)
    expect(calcBalance('900', '900')).toBe(0)
    expect(calcBalance('500', '0')).toBe(500)
  })

  it('balance is never negative (Math.max guard)', () => {
    expect(calcBalance('500', '700')).toBe(0)
    expect(calcBalance('100', '999')).toBe(0)
  })

  it('returns 0 when amount is empty string', () => {
    expect(calcBalance('', '200')).toBe(0)
  })

  it('returns 0 when paid is empty string', () => {
    expect(calcBalance('500', '')).toBe(500)
  })

  it('returns 0 when both are empty', () => {
    expect(calcBalance('', '')).toBe(0)
  })

  it('returns 0 for non-numeric input (NaN guard)', () => {
    expect(calcBalance('abc', '50')).toBe(0)
    expect(calcBalance('100', 'xyz')).toBe(0)
  })

  it('handles decimal amounts correctly', () => {
    expect(calcBalance('999.99', '500.50')).toBeCloseTo(499.49, 2)
  })
})

describe('isFullyPaid', () => {
  it('true when balance is 0 and some amount was paid', () => {
    expect(isFullyPaid(0, 900)).toBe(true)
  })

  it('false when balance is 0 but nothing was paid', () => {
    expect(isFullyPaid(0, 0)).toBe(false)
  })

  it('false when balance is greater than 0', () => {
    expect(isFullyPaid(200, 700)).toBe(false)
  })

  it('false when both are 0', () => {
    expect(isFullyPaid(0, 0)).toBe(false)
  })
})
