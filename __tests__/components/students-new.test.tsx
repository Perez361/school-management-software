// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, style }: any) =>
    React.createElement('a', { href, style }, children),
}))

const mockGetClasses = vi.fn()
const mockGetParents = vi.fn()
const mockCreateStudent = vi.fn()

vi.mock('../../lib/api', () => ({
  api: {
    getClasses:    mockGetClasses,
    getParents:    mockGetParents,
    createStudent: mockCreateStudent,
  },
}))

// Silence console.error from React act() warnings in tests
beforeEach(() => {
  vi.clearAllMocks()
})

async function importPage() {
  // Dynamic import to get a fresh module after mocks are set
  const mod = await import('../../app/(app)/students/new/page')
  return mod.default
}

describe('Add New Student page', () => {
  it('renders the form heading', async () => {
    mockGetClasses.mockResolvedValue([])
    mockGetParents.mockResolvedValue([])
    const Page = await importPage()
    render(React.createElement(Page))
    expect(screen.getByText('Add New Student')).toBeInTheDocument()
  })

  it('classes still load when getParents rejects', async () => {
    mockGetClasses.mockResolvedValue([
      { id: 1, name: 'JHS 1', level: 'JHS' },
      { id: 2, name: 'JHS 2', level: 'JHS' },
    ])
    mockGetParents.mockRejectedValue(new Error('DB error'))

    const Page = await importPage()
    render(React.createElement(Page))

    await waitFor(() => {
      expect(screen.getByText('JHS 1')).toBeInTheDocument()
      expect(screen.getByText('JHS 2')).toBeInTheDocument()
    })
  })

  it('parents still load when getClasses rejects', async () => {
    mockGetClasses.mockRejectedValue(new Error('DB error'))
    mockGetParents.mockResolvedValue([
      { id: 1, name: 'Kofi Mensah', phone: '0244123456' },
      { id: 2, name: 'Ama Asante',  phone: '0244654321' },
    ])

    const Page = await importPage()
    render(React.createElement(Page))

    await waitFor(() => {
      expect(screen.getByText('Kofi Mensah')).toBeInTheDocument()
    })
  })

  it('shows both classes and parents when both succeed', async () => {
    mockGetClasses.mockResolvedValue([{ id: 1, name: 'JHS 1', level: 'JHS' }])
    mockGetParents.mockResolvedValue([{ id: 1, name: 'Kwesi Boateng', phone: '0244000001' }])

    const Page = await importPage()
    render(React.createElement(Page))

    await waitFor(() => {
      expect(screen.getByText('JHS 1')).toBeInTheDocument()
      expect(screen.getByText('Kwesi Boateng')).toBeInTheDocument()
    })
  })

  it('shows an error message when form submission fails', async () => {
    mockGetClasses.mockResolvedValue([{ id: 1, name: 'JHS 1', level: 'JHS' }])
    mockGetParents.mockResolvedValue([])
    mockCreateStudent.mockRejectedValue(new Error('Submission failed'))

    const Page = await importPage()
    render(React.createElement(Page))

    // Fill required fields
    await userEvent.type(screen.getByPlaceholderText('e.g. Kofi Mensah'), 'Test Student')

    const genderSelect = screen.getByDisplayValue('Select gender')
    await userEvent.selectOptions(genderSelect, 'Male')

    const dateInput = document.querySelector('input[type="date"]')!
    await userEvent.type(dateInput as Element, '2012-01-01')

    await waitFor(() => {
      expect(screen.getByText('JHS 1')).toBeInTheDocument()
    })
    const classSelect = screen.getByDisplayValue('Select class')
    await userEvent.selectOptions(classSelect, '1')

    await userEvent.click(screen.getByRole('button', { name: /Save Student/i }))

    await waitFor(() => {
      expect(screen.getByText('Submission failed')).toBeInTheDocument()
    })
  })
})
