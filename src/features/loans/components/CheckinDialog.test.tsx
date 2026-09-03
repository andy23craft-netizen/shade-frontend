import { useState } from 'react'
import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    BookRead,
    LoanRead,
} from '../../../api/apiTypes'
import { CheckinDialog } from './CheckinDialog'

vi.mock('./CheckinForm', () => ({
    CheckinForm: ({
                      book,
                      onCancel,
                      onSuccess,
                  }: {
        book: BookRead
        loans: readonly LoanRead[]
        onCancel: () => void
        onSuccess: () => void
    }) => (
        <div>
            <p>
                Checkin form for {book.title}
            </p>

            <button
                type="button"
                onClick={onCancel}
            >
                Cancel return
            </button>

            <button
                type="button"
                onClick={onSuccess}
            >
                Complete return
            </button>
        </div>
    ),
}))

const book = {
    book_id: 'book-1',
    title: 'The Left Hand of Darkness',
    authors: [
        {
            author_id: 'author-ursula-le-guin',
            first_name: 'Ursula K.',
            surname: 'Le Guin',
        },
    ],
    status: 'on_loan',
} as BookRead

const loans = [
    {
        album_id: null,
        id: 'loan-1',
        book_id: 'book-1',
        borrower: 'Jane Reader',
        checked_out_at:
            '2026-08-20T12:00:00Z',
        due_at: null,
        returned_at: null,
    } as LoanRead,
]

function renderDialog({
                          open = true,
                          onClose = vi.fn(),
                      }: {
    open?: boolean
    onClose?: () => void
} = {}) {
    return {
        onClose,
        ...render(
            <CheckinDialog
                book={book}
                loans={loans}
                open={open}
                onClose={onClose}
            />,
        ),
    }
}

function OpenCloseHarness() {
    const [
        open,
        setOpen,
    ] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => {
                    setOpen(true)
                }}
            >
                Open check-in
            </button>

            <CheckinDialog
                book={book}
                loans={loans}
                open={open}
                onClose={() => {
                    setOpen(false)
                }}
            />
        </>
    )
}

describe('CheckinDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('opens as a modal dialog for the selected book', async () => {
        renderDialog()

        const dialog =
            await screen.findByRole(
                'dialog',
                {
                    name: 'Check In',
                },
            )

        expect(dialog).toBeInTheDocument()

        expect(
            within(dialog).getByText(
                'The Left Hand of Darkness',
            ),
        ).toBeInTheDocument()

        expect(
            within(dialog).getByText(
                /Ursula K\. Le Guin/,
            ),
        ).toBeInTheDocument()

        expect(
            within(dialog).getByText(
                'Checkin form for The Left Hand of Darkness',
            ),
        ).toBeInTheDocument()
    })

    it('does not open when open is false', () => {
        renderDialog({
            open: false,
        })

        expect(
            screen.queryByRole('dialog'),
        ).not.toBeInTheDocument()
    })

    it('closes when the check-in form is cancelled', async () => {
        const onClose = vi.fn()

        renderDialog({
            onClose,
        })

        fireEvent.click(
            await screen.findByRole(
                'button',
                {
                    name: 'Cancel return',
                },
            ),
        )

        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('closes after the check-in form succeeds', async () => {
        const onClose = vi.fn()

        renderDialog({
            onClose,
        })

        fireEvent.click(
            await screen.findByRole(
                'button',
                {
                    name: 'Complete return',
                },
            ),
        )

        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('handles Escape through the native dialog cancel event', async () => {
        const onClose = vi.fn()

        renderDialog({
            onClose,
        })

        const dialog =
            await screen.findByRole(
                'dialog',
                {
                    name: 'Check In',
                },
            )

        const cancelEvent =
            new Event('cancel', {
                cancelable: true,
            })

        dialog.dispatchEvent(cancelEvent)

        expect(
            cancelEvent.defaultPrevented,
        ).toBe(true)

        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('restores focus to the opener when closed', async () => {
        render(<OpenCloseHarness />)

        const opener =
            screen.getByRole(
                'button',
                {
                    name: 'Open check-in',
                },
            )

        opener.focus()

        fireEvent.click(opener)

        await screen.findByRole(
            'dialog',
            {
                name: 'Check In',
            },
        )

        fireEvent.click(
            screen.getByRole(
                'button',
                {
                    name: 'Cancel return',
                },
            ),
        )

        await waitFor(() => {
            expect(opener).toHaveFocus()
        })
    })

    it('focuses the first control when opened', async () => {
        render(<OpenCloseHarness />)

        fireEvent.click(
            screen.getByRole(
                'button',
                {
                    name: 'Open check-in',
                },
            ),
        )

        await waitFor(() => {
            expect(
                screen.getByRole(
                    'button',
                    {
                        name: 'Cancel return',
                    },
                ),
            ).toHaveFocus()
        })
    })

    it('wraps Tab focus from the last control to the first', async () => {
        renderDialog()

        const dialog =
            await screen.findByRole(
                'dialog',
                {
                    name: 'Check In',
                },
            )

        const first =
            screen.getByRole(
                'button',
                {
                    name: 'Cancel return',
                },
            )

        const last =
            screen.getByRole(
                'button',
                {
                    name: 'Complete return',
                },
            )

        last.focus()

        fireEvent.keyDown(
            dialog,
            {
                key: 'Tab',
            },
        )

        expect(first).toHaveFocus()
    })

    it('wraps Shift+Tab focus from the first control to the last', async () => {
        renderDialog()

        const dialog =
            await screen.findByRole(
                'dialog',
                {
                    name: 'Check In',
                },
            )

        const first =
            screen.getByRole(
                'button',
                {
                    name: 'Cancel return',
                },
            )

        const last =
            screen.getByRole(
                'button',
                {
                    name: 'Complete return',
                },
            )

        first.focus()

        fireEvent.keyDown(
            dialog,
            {
                key: 'Tab',
                shiftKey: true,
            },
        )

        expect(last).toHaveFocus()
    })
})
