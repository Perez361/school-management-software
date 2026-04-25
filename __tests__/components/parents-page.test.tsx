// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import React from 'react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, style }: any) =>
    React.createElement('a', { href, style }, children),
}))

vi.mock('../../components/Pagination', () => ({
  default: () => null,
}))

vi.mock('../../lib/live-data', () => ({
  useLiveData: () => ({ version: 0, bump: vi.fn() }),
}))

const mockCan = vi.fn().mockReturnValue(true)
vi.mock('../../lib/auth-context', () => ({
  useAuth: () => ({ can: mockCan }),
}))

const mockGetParents = vi.fn()
const mockDeleteParent = vi.fn()

vi.mock('../../lib/api', () => ({
  api: {
    getParents:    mockGetParents,
    deleteParent:  mockDeleteParent,
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockCan.mockReturnValue(true)
})

async function importPage() {
  const mod = await import('../../app/(app)/parents/page')
  return mod.default
}

describe('Parents page', () => {
  it('shows empty state when no parents are registered', async () => {
    mockGetParents.mockResolvedValue([])
    const Page = await importPage()
    render(React.createElement(Page))
    await waitFor(() => {
      expect(screen.getByText('No parents registered yet')).toBeInTheDocument()
    })
  })

  it('renders a parent row after data loads', async () => {
    mockGetParents.mockResolvedValue([
      { id: 1, name: 'Kofi Mensah', phone: '+233 24 111 0001', email: null, address: 'Accra', studentCount: 2 },
    ])
    const Page = await importPage()
    render(React.createElement(Page))
    await waitFor(() => {
      expect(screen.getByText('Kofi Mensah')).toBeInTheDocument()
    })
  })

  it('renders the phone number of a parent', async () => {
    mockGetParents.mockResolvedValue([
      { id: 1, name: 'Ama Boateng', phone: '+233 24 222 0002', email: 'ama@gmail.com', address: null, studentCount: 1 },
    ])
    const Page = await importPage()
    render(React.createElement(Page))
    await waitFor(() => {
      expect(screen.getByText('+233 24 222 0002')).toBeInTheDocument()
    })
  })

  it('shows correct parent count in the subheading', async () => {
    const parents = [
      { id: 1, name: 'A', phone: '1', email: null, address: null, studentCount: 0 },
      { id: 2, name: 'B', phone: '2', email: null, address: null, studentCount: 0 },
      { id: 3, name: 'C', phone: '3', email: null, address: null, studentCount: 0 },
    ]
    mockGetParents.mockResolvedValue(parents)
    const Page = await importPage()
    render(React.createElement(Page))
    await waitFor(() => {
      expect(screen.getByText('3 registered')).toBeInTheDocument()
    })
  })

  it('filters parents by search query', async () => {
    mockGetParents.mockResolvedValue([
      { id: 1, name: 'Kofi Mensah', phone: '001', email: null, address: null, studentCount: 0 },
      { id: 2, name: 'Ama Boateng', phone: '002', email: null, address: null, studentCount: 0 },
    ])
    const Page = await importPage()
    render(React.createElement(Page))

    await waitFor(() => {
      expect(screen.getByText('Kofi Mensah')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText(/Search by name/i), {
      target: { value: 'kofi' },
    })

    expect(screen.getByText('Kofi Mensah')).toBeInTheDocument()
    expect(screen.queryByText('Ama Boateng')).not.toBeInTheDocument()
  })

  it('shows no-match message when search returns nothing', async () => {
    mockGetParents.mockResolvedValue([
      { id: 1, name: 'Kofi Mensah', phone: '001', email: null, address: null, studentCount: 0 },
    ])
    const Page = await importPage()
    render(React.createElement(Page))

    await waitFor(() => { expect(screen.getByText('Kofi Mensah')).toBeInTheDocument() })

    fireEvent.change(screen.getByPlaceholderText(/Search by name/i), {
      target: { value: 'zzznomatch' },
    })

    expect(screen.getByText('No parents match your search')).toBeInTheDocument()
  })

  it('shows error state gracefully when API fails', async () => {
    mockGetParents.mockRejectedValue(new Error('Network error'))
    const Page = await importPage()
    render(React.createElement(Page))
    await waitFor(() => {
      expect(screen.getByText('No parents registered yet')).toBeInTheDocument()
    })
  })
})
