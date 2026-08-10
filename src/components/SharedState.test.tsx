import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Alert } from './Alert'
import { EmptyState } from './EmptyState'
import { Field } from './Field'
import { LoadingState } from './LoadingState'

describe('shared state primitives', () => {
  it('associates field labels, help text, and errors with the control', () => {
    render(
      <Field
        label="Borrower name"
        helpText="Required for checkout"
        error="Enter a borrower name"
      >
        <input />
      </Field>,
    )

    const control = screen.getByRole('textbox', {
      name: 'Borrower name',
    })

    expect(control).toHaveAccessibleDescription(
      'Required for checkout Enter a borrower name',
    )
    expect(control).toBeInvalid()
    expect(
      screen.getByText('Enter a borrower name'),
    ).toBeVisible()
  })

  it('uses alert roles for errors and status roles for other variants', () => {
    const { rerender } = render(
      <Alert variant="error" title="Save failed">
        The book could not be saved.
      </Alert>,
    )

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent('Save failed')

    rerender(
      <Alert variant="success" title="Saved">
        The book was saved.
      </Alert>,
    )

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent('Saved')

    rerender(
      <Alert variant="info">
        Connection settings are ready.
      </Alert>,
    )

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent('Connection settings are ready.')

    rerender(
      <Alert variant="warning">
        This ISBN may already exist.
      </Alert>,
    )

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent('This ISBN may already exist.')
  })

  it('exposes a polite loading status with a visible label', () => {
    render(<LoadingState label="Loading books" />)

    const status = screen.getByRole('status')

    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status).toHaveTextContent('Loading books')
    expect(
      status.querySelector('.loading-state__indicator'),
    ).toHaveAttribute('aria-hidden', 'true')
  })

  it('names empty states from their title', () => {
    render(
      <EmptyState title="No books yet">
        Add a book to get started.
      </EmptyState>,
    )

    expect(
      screen.getByRole('region', {
        name: 'No books yet',
      }),
    ).toHaveTextContent('Add a book to get started.')
  })
})
