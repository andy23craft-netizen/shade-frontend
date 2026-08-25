import {
  fireEvent,
  screen,
  waitFor,
} from '@testing-library/react'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  mockReachableApi,
  renderAppTree,
} from './test/renderAppTree'

describe('application routing effects', () => {
  beforeEach(() => {
    mockReachableApi()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sets the document title on initial load without moving focus', async () => {
    const focusTarget = document.createElement('button')
    focusTarget.type = 'button'
    focusTarget.textContent = 'Focus target'
    document.body.appendChild(focusTarget)
    focusTarget.focus()

    try {
      await renderAppTree(['/books'])

      await waitFor(() => {
        expect(document.title).toBe('Books — Shade')
      })

      expect(document.activeElement).toBe(focusTarget)
    } finally {
      focusTarget.remove()
    }
  })

  it('updates the title and focuses the heading after client-side navigation', async () => {
    await renderAppTree(['/books'])

    const loansLink = screen.getByRole('link', {
      name: 'Loans',
    })

    fireEvent.click(loansLink)

    expect(
        await screen.findByRole('heading', {
          level: 1,
          name: 'Loans',
        }),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(document.title).toBe('Loans — Shade')
      expect(document.activeElement).toBe(
          screen.getByRole('main'),
      )
    })
  })

  it('makes route headings programmatically focusable', async () => {
    await renderAppTree(['/books'])

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'Books',
    })

    expect(heading).toHaveAttribute('tabindex', '-1')
  })
})
