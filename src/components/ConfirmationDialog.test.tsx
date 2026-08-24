import { useState } from 'react'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmationDialog } from './ConfirmationDialog'

function DialogHarness({
  onConfirm = () => undefined,
  onCancel = () => undefined,
}: {
  onConfirm?: () => void
  onCancel?: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open dialog
      </button>

      <ConfirmationDialog
        open={open}
        title="Delete this book?"
        confirmLabel="Delete"
        onConfirm={() => {
          onConfirm()
          setOpen(false)
        }}
        onCancel={() => {
          onCancel()
          setOpen(false)
        }}
      >
        Soft deletion keeps loan history.
      </ConfirmationDialog>
    </>
  )
}

describe('ConfirmationDialog', () => {
  it('exposes an accessible name and description', async () => {
    render(<DialogHarness />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Open dialog' }),
    )

    const dialog = await screen.findByRole('dialog', {
      name: 'Delete this book?',
    })

    expect(dialog).toHaveAccessibleDescription(
      'Soft deletion keeps loan history.',
    )
  })

  it('focuses the least destructive action when opened', async () => {
    render(<DialogHarness />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Open dialog' }),
    )

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Cancel' }),
      ).toHaveFocus()
    })
  })

  it('cancels on Escape and restores focus to the opener', async () => {
    const onCancel = vi.fn()

    render(<DialogHarness onCancel={onCancel} />)

    const opener = screen.getByRole('button', {
      name: 'Open dialog',
    })

    opener.focus()
    fireEvent.click(opener)

    const dialog = await screen.findByRole('dialog')

    // jsdom does not synthesize the dialog cancel event from Escape.
    dialog.dispatchEvent(
      new Event('cancel', { cancelable: true }),
    )

    await waitFor(() => {
      expect(onCancel).toHaveBeenCalledTimes(1)
      expect(opener).toHaveFocus()
    })
  })

  it('confirms with the danger action and restores focus', async () => {
    const onConfirm = vi.fn()

    render(<DialogHarness onConfirm={onConfirm} />)

    const opener = screen.getByRole('button', {
      name: 'Open dialog',
    })

    opener.focus()
    fireEvent.click(opener)

    const dialog = await screen.findByRole('dialog')
    const confirmButton = within(dialog).getByRole('button', {
      name: 'Delete',
    })

    expect(confirmButton.className).toContain('button--danger')

    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1)
      expect(opener).toHaveFocus()
    })
  })

  it('keeps keyboard focus inside the dialog', async () => {
    render(<DialogHarness />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Open dialog' }),
    )

    const dialog = await screen.findByRole('dialog')
    const cancelButton = within(dialog).getByRole('button', {
      name: 'Cancel',
    })
    const confirmButton = within(dialog).getByRole('button', {
      name: 'Delete',
    })

    cancelButton.focus()
    fireEvent.keyDown(dialog, {
      key: 'Tab',
      code: 'Tab',
      shiftKey: true,
    })

    await waitFor(() => {
      expect(confirmButton).toHaveFocus()
    })

    fireEvent.keyDown(dialog, {
      key: 'Tab',
      code: 'Tab',
    })

    await waitFor(() => {
      expect(cancelButton).toHaveFocus()
    })
  })

  it('can disable dialog actions while an operation is pending', () => {
    render(
        <ConfirmationDialog
            open
            title="Confirm move"
            confirmLabel="Move books"
            confirmDisabled
            cancelDisabled
            onConfirm={() => {}}
            onCancel={() => {}}
        >
          Move these books?
        </ConfirmationDialog>,
    )

    expect(
        screen.getByRole('button', {
          name: 'Move books',
        }),
    ).toBeDisabled()

    expect(
        screen.getByRole('button', {
          name: 'Cancel',
        }),
    ).toBeDisabled()
  })
})
