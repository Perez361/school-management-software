import { describe, it, expect } from 'vitest'
import { can, allowedRoutes } from '../lib/permissions'
import type { Feature } from '../lib/permissions'

describe('can()', () => {
  describe('admin', () => {
    it('can access all features', () => {
      const allFeatures: Feature[] = [
        'dashboard', 'students', 'students:write',
        'parents', 'staff', 'classes', 'subjects',
        'ca-scores', 'exam-records', 'results', 'attendance',
        'billing', 'reports', 'promotion', 'settings', 'users',
      ]
      allFeatures.forEach(f => {
        expect(can('admin', f), `admin should have ${f}`).toBe(true)
      })
    })
  })

  describe('teacher', () => {
    it('can access academic features', () => {
      expect(can('teacher', 'dashboard')).toBe(true)
      expect(can('teacher', 'students')).toBe(true)
      expect(can('teacher', 'ca-scores')).toBe(true)
      expect(can('teacher', 'exam-records')).toBe(true)
      expect(can('teacher', 'results')).toBe(true)
      expect(can('teacher', 'attendance')).toBe(true)
      expect(can('teacher', 'reports')).toBe(true)
    })

    it('cannot access admin-only features', () => {
      expect(can('teacher', 'students:write')).toBe(false)
      expect(can('teacher', 'parents')).toBe(false)
      expect(can('teacher', 'staff')).toBe(false)
      expect(can('teacher', 'classes')).toBe(false)
      expect(can('teacher', 'subjects')).toBe(false)
      expect(can('teacher', 'promotion')).toBe(false)
      expect(can('teacher', 'settings')).toBe(false)
      expect(can('teacher', 'users')).toBe(false)
    })

    it('cannot access billing (accountant-only)', () => {
      expect(can('teacher', 'billing')).toBe(false)
    })
  })

  describe('accountant', () => {
    it('can access finance features', () => {
      expect(can('accountant', 'dashboard')).toBe(true)
      expect(can('accountant', 'students')).toBe(true)
      expect(can('accountant', 'billing')).toBe(true)
      expect(can('accountant', 'reports')).toBe(true)
    })

    it('cannot access academic or admin-only features', () => {
      expect(can('accountant', 'students:write')).toBe(false)
      expect(can('accountant', 'ca-scores')).toBe(false)
      expect(can('accountant', 'exam-records')).toBe(false)
      expect(can('accountant', 'results')).toBe(false)
      expect(can('accountant', 'attendance')).toBe(false)
      expect(can('accountant', 'parents')).toBe(false)
      expect(can('accountant', 'staff')).toBe(false)
      expect(can('accountant', 'promotion')).toBe(false)
      expect(can('accountant', 'settings')).toBe(false)
      expect(can('accountant', 'users')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('returns false for null role', () => {
      expect(can(null, 'dashboard')).toBe(false)
    })

    it('returns false for undefined role', () => {
      expect(can(undefined, 'dashboard')).toBe(false)
    })

    it('returns false for unknown role', () => {
      expect(can('superuser', 'dashboard')).toBe(false)
    })

    it('is case-insensitive for role', () => {
      expect(can('Admin', 'dashboard')).toBe(true)
      expect(can('TEACHER', 'results')).toBe(true)
      expect(can('Accountant', 'billing')).toBe(true)
    })
  })
})

describe('allowedRoutes()', () => {
  it('returns all routes for admin', () => {
    const routes = allowedRoutes('admin')
    expect(routes.has('/dashboard')).toBe(true)
    expect(routes.has('/students')).toBe(true)
    expect(routes.has('/parents')).toBe(true)
    expect(routes.has('/staff')).toBe(true)
    expect(routes.has('/classes')).toBe(true)
    expect(routes.has('/subjects')).toBe(true)
    expect(routes.has('/ca-scores')).toBe(true)
    expect(routes.has('/exam-records')).toBe(true)
    expect(routes.has('/results')).toBe(true)
    expect(routes.has('/attendance')).toBe(true)
    expect(routes.has('/billing')).toBe(true)
    expect(routes.has('/reports')).toBe(true)
    expect(routes.has('/promotion')).toBe(true)
    expect(routes.has('/settings')).toBe(true)
    expect(routes.has('/users')).toBe(true)
  })

  it('returns only academic routes for teacher', () => {
    const routes = allowedRoutes('teacher')
    expect(routes.has('/dashboard')).toBe(true)
    expect(routes.has('/students')).toBe(true)
    expect(routes.has('/ca-scores')).toBe(true)
    expect(routes.has('/exam-records')).toBe(true)
    expect(routes.has('/results')).toBe(true)
    expect(routes.has('/attendance')).toBe(true)
    expect(routes.has('/reports')).toBe(true)

    expect(routes.has('/parents')).toBe(false)
    expect(routes.has('/staff')).toBe(false)
    expect(routes.has('/billing')).toBe(false)
    expect(routes.has('/settings')).toBe(false)
    expect(routes.has('/users')).toBe(false)
    expect(routes.has('/promotion')).toBe(false)
  })

  it('returns only finance routes for accountant', () => {
    const routes = allowedRoutes('accountant')
    expect(routes.has('/dashboard')).toBe(true)
    expect(routes.has('/students')).toBe(true)
    expect(routes.has('/billing')).toBe(true)
    expect(routes.has('/reports')).toBe(true)

    expect(routes.has('/ca-scores')).toBe(false)
    expect(routes.has('/exam-records')).toBe(false)
    expect(routes.has('/attendance')).toBe(false)
    expect(routes.has('/parents')).toBe(false)
    expect(routes.has('/settings')).toBe(false)
    expect(routes.has('/users')).toBe(false)
  })

  it('returns an empty set for null or unknown role', () => {
    expect(allowedRoutes(null).size).toBe(0)
    expect(allowedRoutes(undefined).size).toBe(0)
    expect(allowedRoutes('unknown').size).toBe(0)
  })
})
