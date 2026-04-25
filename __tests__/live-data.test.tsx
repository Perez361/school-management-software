// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { LiveDataProvider, useLiveData } from '../lib/live-data'

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(LiveDataProvider, null, children)
}

describe('useLiveData', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('version starts at 0', () => {
    const { result } = renderHook(() => useLiveData(), { wrapper })
    expect(result.current.version).toBe(0)
  })

  it('bump() increments version by 1', () => {
    const { result } = renderHook(() => useLiveData(), { wrapper })
    act(() => { result.current.bump() })
    expect(result.current.version).toBe(1)
  })

  it('bump() can be called multiple times', () => {
    const { result } = renderHook(() => useLiveData(), { wrapper })
    act(() => {
      result.current.bump()
      result.current.bump()
      result.current.bump()
    })
    expect(result.current.version).toBe(3)
  })

  it('auto-polls: version increments after 8 seconds', () => {
    const { result } = renderHook(() => useLiveData(), { wrapper })
    expect(result.current.version).toBe(0)
    act(() => { vi.advanceTimersByTime(8000) })
    expect(result.current.version).toBe(1)
  })

  it('auto-polls: version increments again after 16 seconds', () => {
    const { result } = renderHook(() => useLiveData(), { wrapper })
    act(() => { vi.advanceTimersByTime(16000) })
    expect(result.current.version).toBe(2)
  })

  it('does not poll before 8 seconds have passed', () => {
    const { result } = renderHook(() => useLiveData(), { wrapper })
    act(() => { vi.advanceTimersByTime(7999) })
    expect(result.current.version).toBe(0)
  })

  it('clears the interval on unmount (no memory leak)', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    const { unmount } = renderHook(() => useLiveData(), { wrapper })
    unmount()
    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('manual bump and polling both increment the same version counter', () => {
    const { result } = renderHook(() => useLiveData(), { wrapper })
    act(() => { result.current.bump() })        // manual: version = 1
    act(() => { vi.advanceTimersByTime(8000) }) // poll:   version = 2
    expect(result.current.version).toBe(2)
  })
})
