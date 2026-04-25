// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'

// Mock the api module before importing auth-context
vi.mock('../lib/api', () => ({
  api: {
    login: vi.fn(),
  },
  clearAuthToken: vi.fn(),
  setAuthToken: vi.fn(),
}))

import { AuthProvider, useAuth } from '../lib/auth-context'
import { api, clearAuthToken } from '../lib/api'

const STORAGE_KEY = 'sms_user'
const DEMO_KEY    = 'sms_demo'

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(AuthProvider, null, children)
}

describe('useAuth – initial state', () => {
  beforeEach(() => { localStorage.clear() })

  it('starts with user null and loading false after mount', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    // After the effect runs, loading should be false
    await act(async () => {})
    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('restores user from localStorage on mount', async () => {
    const saved = { id: 1, username: 'admin', email: 'a@b.com', role: 'admin', name: 'Admin' }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})
    expect(result.current.user?.username).toBe('admin')
    expect(result.current.loading).toBe(false)
  })

  it('handles corrupted localStorage gracefully (no crash)', async () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json{{')
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})
    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('starts as non-demo by default', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})
    expect(result.current.isDemo).toBe(false)
  })
})

describe('useAuth – login()', () => {
  beforeEach(() => { localStorage.clear(); vi.clearAllMocks() })

  it('sets user on successful login', async () => {
    const mockUser = { id: 1, username: 'kofi', email: 'k@school.gh', role: 'teacher', name: 'Kofi' }
    vi.mocked(api.login).mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.login('k@school.gh', 'pass123')
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isDemo).toBe(false)
  })

  it('persists user to localStorage after login', async () => {
    const mockUser = { id: 2, username: 'ama', email: 'a@school.gh', role: 'admin', name: 'Ama' }
    vi.mocked(api.login).mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})
    await act(async () => { await result.current.login('a@school.gh', 'pass') })

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored.username).toBe('ama')
  })

  it('removes demo key from localStorage after login', async () => {
    localStorage.setItem(DEMO_KEY, '1')
    const mockUser = { id: 1, username: 'admin', email: 'a@b.com', role: 'admin', name: 'Admin' }
    vi.mocked(api.login).mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})
    await act(async () => { await result.current.login('a@b.com', 'pass') })

    expect(localStorage.getItem(DEMO_KEY)).toBeNull()
  })

  it('propagates API errors to the caller', async () => {
    vi.mocked(api.login).mockRejectedValue(new Error('Invalid credentials'))

    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})

    await expect(
      act(async () => { await result.current.login('bad@email.com', 'wrong') })
    ).rejects.toThrow('Invalid credentials')
    expect(result.current.user).toBeNull()
  })
})

describe('useAuth – logout()', () => {
  beforeEach(() => { localStorage.clear(); vi.clearAllMocks() })

  it('clears user and isDemo on logout', async () => {
    const mockUser = { id: 1, username: 'admin', email: 'a@b.com', role: 'admin', name: 'Admin' }
    vi.mocked(api.login).mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})
    await act(async () => { await result.current.login('a@b.com', 'pass') })
    act(() => { result.current.logout() })

    expect(result.current.user).toBeNull()
    expect(result.current.isDemo).toBe(false)
  })

  it('removes both localStorage keys on logout', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: 1 }))
    localStorage.setItem(DEMO_KEY, '1')

    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})
    act(() => { result.current.logout() })

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem(DEMO_KEY)).toBeNull()
  })

  it('calls clearAuthToken on logout', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})
    act(() => { result.current.logout() })
    expect(clearAuthToken).toHaveBeenCalled()
  })
})

describe('useAuth – can()', () => {
  beforeEach(() => { localStorage.clear(); vi.clearAllMocks() })

  it('returns false for every feature when no user is logged in', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})
    expect(result.current.can('dashboard')).toBe(false)
    expect(result.current.can('students')).toBe(false)
    expect(result.current.can('billing')).toBe(false)
  })

  it('admin can access all features', async () => {
    const stored = { id: 1, username: 'a', email: 'a@b.com', role: 'admin', name: 'A' }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})
    expect(result.current.can('dashboard')).toBe(true)
    expect(result.current.can('users')).toBe(true)
    expect(result.current.can('promotion')).toBe(true)
    expect(result.current.can('billing')).toBe(true)
  })

  it('teacher cannot access billing or users', async () => {
    const stored = { id: 2, username: 't', email: 't@b.com', role: 'teacher', name: 'T' }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})
    expect(result.current.can('billing')).toBe(false)
    expect(result.current.can('users')).toBe(false)
    expect(result.current.can('results')).toBe(true)
  })

  it('accountant can access billing but not exam-records', async () => {
    const stored = { id: 3, username: 'ac', email: 'ac@b.com', role: 'accountant', name: 'Ac' }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})
    expect(result.current.can('billing')).toBe(true)
    expect(result.current.can('exam-records')).toBe(false)
  })
})
