import {
    useEffect,
    useId,
    useRef,
} from 'react'

import type {
    BookRead,
    LoanRead,
} from '../../../api/apiTypes'
import { CheckinForm } from './CheckinForm'

export interface CheckinDialogProps {
    book: BookRead
    loans: readonly LoanRead[]
    open: boolean
    onClose: () => void
}

function getFocusableElements(
    container: HTMLElement,
): HTMLElement[] {
    const candidates =
        container.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )

    return Array.from(candidates).filter(
        (element) =>
            element.getAttribute('aria-hidden') !==
            'true',
    )
}

export function CheckinDialog({
                                  book,
                                  loans,
                                  open,
                                  onClose,
                              }: CheckinDialogProps) {
    const dialogRef =
        useRef<HTMLDialogElement>(null)

    const previousFocusRef =
        useRef<HTMLElement | null>(null)

    const onCloseRef =
        useRef(onClose)

    const titleId = useId()

    useEffect(() => {
        onCloseRef.current = onClose
    }, [onClose])

    useEffect(() => {
        const dialog = dialogRef.current

        if (!dialog) {
            return
        }

        if (open && !dialog.open) {
            previousFocusRef.current =
                document.activeElement instanceof
                HTMLElement
                    ? document.activeElement
                    : null

            dialog.showModal()

            window.requestAnimationFrame(() => {
                const focusable =
                    getFocusableElements(dialog)

                focusable[0]?.focus()
            })

            return
        }

        if (!open && dialog.open) {
            dialog.close()

            const previousFocus =
                previousFocusRef.current

            previousFocusRef.current = null
            previousFocus?.focus()
        }
    }, [open])

    useEffect(() => {
        const dialogElement =
            dialogRef.current

        if (!dialogElement) {
            return
        }

        const dialog =
            dialogElement

        function restoreFocus() {
            const previousFocus =
                previousFocusRef.current

            previousFocusRef.current = null
            previousFocus?.focus()
        }

        function handleCancel(
            event: Event,
        ) {
            event.preventDefault()
            onCloseRef.current()
        }

        function handleClose() {
            restoreFocus()
        }

        function handleKeyDown(
            event: KeyboardEvent,
        ) {
            if (
                event.key !== 'Tab' ||
                !dialog.open
            ) {
                return
            }

            const focusable =
                getFocusableElements(dialog)

            if (focusable.length === 0) {
                return
            }

            const first = focusable[0]
            const last =
                focusable[
                focusable.length - 1
                    ]

            if (
                event.shiftKey &&
                document.activeElement === first
            ) {
                event.preventDefault()
                last.focus()
                return
            }

            if (
                !event.shiftKey &&
                document.activeElement === last
            ) {
                event.preventDefault()
                first.focus()
            }
        }

        dialog.addEventListener(
            'cancel',
            handleCancel,
        )

        dialog.addEventListener(
            'close',
            handleClose,
        )

        dialog.addEventListener(
            'keydown',
            handleKeyDown,
        )

        return () => {
            dialog.removeEventListener(
                'cancel',
                handleCancel,
            )

            dialog.removeEventListener(
                'close',
                handleClose,
            )

            dialog.removeEventListener(
                'keydown',
                handleKeyDown,
            )
        }
    }, [])

    return (
        <dialog
            ref={dialogRef}
            className="confirmation-dialog checkin-dialog"
            aria-labelledby={titleId}
        >
            <div className="confirmation-dialog__content">
                <h2 id={titleId}>
                    Check In
                </h2>

                <p>
                    <strong>
                        {book.title}
                    </strong>
                    {' — '}
                    {book.authors}
                </p>

                <CheckinForm
                    book={book}
                    loans={loans}
                    onCancel={onClose}
                    onSuccess={onClose}
                />
            </div>
        </dialog>
    )
}
