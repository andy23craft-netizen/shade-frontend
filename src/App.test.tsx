import { StrictMode } from 'react'
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { createTestRouter } from './routes/createMemoryRouter'

function renderApp(initialEntries: string[] = ['/']) {
  const router = createTestRouter(initialEntries)

  render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
  )

  return router
}

describe('application routing effects', () => {
  it('sets the document title on initial load without moving focus', async () => {
    const focusTarget = document.createElement('button')
    focusTarget.type = 'button'
    focusTarget.textContent = 'Focus target'
    document.body.appendChild(focusTarget)
    focusTarget.focus()

    try {
      renderApp(['/books'])

      await waitFor(() => {
        expect(document.title).toBe('Books — Shade')
      })

      expect(document.activeElement).toBe(focusTarget)
    } finally {
      focusTarget.remove()
    }
  })

  it('updates the title and focuses the heading after client-side navigation', async () => {
    renderApp(['/books'])

    const loansLink = screen.getByRole('link', {
      name: 'Loans',
    })

    fireEvent.click(loansLink)

    const heading = await screen.findByRole('heading', {
      level: 1,
      name: 'Loans',
    })

    await waitFor(() => {
      expect(document.title).toBe('Loans — Shade')
      expect(document.activeElement).toBe(heading)
    })
  })

  it('makes route headings programmatically focusable', () => {
    renderApp(['/books'])

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'Books',
    })

    expect(heading).toHaveAttribute('tabindex', '-1')
  })
})