import {
    useEffect,
    useId,
    useRef,
    useState,
    type FormEvent,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { Button } from '../../../components/Button'
import { Field } from '../../../components/Field'
import {
    isApiError,
    type ApiFieldError,
} from '../../../api/apiErrors'
import {
    isBookIdentityError,
} from '../../../api/bookIdentity'
import type { BookRead } from '../../../api/apiTypes'
import { useCheckoutBook } from '../../../api/booksQueries'
import { queryKeys } from '../../../api/queryKeys'
import { formatBookAuthors } from '../../books/authorDisplay'
import {
    checkoutFormDefaults,
    checkoutFormValuesToRequest,
    validateCheckoutFormValues,
    type CheckoutFormFieldErrors,
    type CheckoutFormValues,
} from '../checkoutModel'
import { isCheckoutEligible } from '../checkoutEligibility'

export interface CheckoutDialogProps {
    book: BookRead
    open: boolean
    onClose: () => void
}

const CHECKOUT_FORM_FIELDS = new Set([
    'borrower',
    'notes',
])

const FIELD_LABELS: Record<
    keyof CheckoutFormFieldErrors,
    string
> = {
    borrower: 'Borrower',
    notes: 'Notes',
}

const FIELD_IDS: Record<
    keyof CheckoutFormFieldErrors,
    string
> = {
    borrower: 'checkout-borrower',
    notes: 'checkout-notes',
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

function mapCheckoutFieldErrors(
    fieldErrors: readonly ApiFieldError[],
): CheckoutFormFieldErrors {
    const mapped: CheckoutFormFieldErrors = {}

    for (const entry of fieldErrors) {
        const field = entry.field.split('.')[0]

        if (
            !field ||
            !CHECKOUT_FORM_FIELDS.has(field) ||
            mapped[
                field as keyof CheckoutFormFieldErrors
                ]
        ) {
            continue
        }

        mapped[
            field as keyof CheckoutFormFieldErrors
            ] = entry.message
    }

    return mapped
}

function unmappedCheckoutFieldErrors(
    fieldErrors: readonly ApiFieldError[],
): ApiFieldError[] {
    return fieldErrors.filter((entry) => {
        const field = entry.field.split('.')[0]

        return (
            !field ||
            !CHECKOUT_FORM_FIELDS.has(field)
        )
    })
}

export function CheckoutDialog({
                                   book,
                                   open,
                                   onClose,
                               }: CheckoutDialogProps) {
    const queryClient = useQueryClient()
    const checkoutBook = useCheckoutBook()

    const dialogRef =
        useRef<HTMLDialogElement>(null)
    const borrowerInputRef =
        useRef<HTMLInputElement>(null)
    const summaryRef =
        useRef<HTMLDivElement>(null)
    const previousFocusRef =
        useRef<HTMLElement | null>(null)
    const onCloseRef = useRef(onClose)

    const titleId = useId()

    const [values, setValues] =
        useState<CheckoutFormValues>(
            checkoutFormDefaults,
        )

    const [fieldErrors, setFieldErrors] =
        useState<CheckoutFormFieldErrors>({})

    const [formError, setFormError] =
        useState<string | null>(null)

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
                borrowerInputRef.current?.focus()
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
        const dialog = dialogRef.current

        if (!dialog) {
            return
        }

        const restoreFocus = () => {
            const previousFocus =
                previousFocusRef.current

            previousFocusRef.current = null
            previousFocus?.focus()
        }

        const handleCancel = (event: Event) => {
            event.preventDefault()

            if (checkoutBook.isPending) {
                return
            }

            setValues(checkoutFormDefaults)
            setFieldErrors({})
            setFormError(null)
            onCloseRef.current()
        }

        const handleClose = () => {
            restoreFocus()
        }

        const handleKeyDown = (
            event: KeyboardEvent,
        ) => {
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
                focusable[focusable.length - 1]

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
    }, [checkoutBook.isPending])

    const errorEntries = (
        Object.entries(fieldErrors) as [
            keyof CheckoutFormFieldErrors,
            string,
        ][]
    ).filter(
        (
            entry,
        ): entry is [
            keyof CheckoutFormFieldErrors,
            string,
        ] => Boolean(entry[1]),
    )

    const hasSummary =
        errorEntries.length > 0 ||
        Boolean(formError)

    useEffect(() => {
        if (!hasSummary) {
            return
        }

        summaryRef.current?.focus()
    }, [
        formError,
        fieldErrors,
        hasSummary,
    ])

    function resetForm() {
        setValues(checkoutFormDefaults)
        setFieldErrors({})
        setFormError(null)
    }

    function handleCancelCheckout() {
        if (checkoutBook.isPending) {
            return
        }

        resetForm()
        onCloseRef.current()
    }

    function updateField(
        field: keyof CheckoutFormValues,
        value: string,
    ) {
        setValues((current) => ({
            ...current,
            [field]: value,
        }))

        setFieldErrors((current) => {
            if (!(field in current)) {
                return current
            }

            const next = {
                ...current,
            }

            delete next[field]
            return next
        })

        setFormError(null)
    }

    async function refetchStaleLoanState() {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: queryKeys.books.all,
            }),
            queryClient.invalidateQueries({
                queryKey:
                    queryKeys.books.detail(book.book_id),
            }),
            queryClient.invalidateQueries({
                queryKey: queryKeys.loans.all,
            }),
        ])
    }

    async function handleCheckoutError(
        error: unknown,
    ) {
        if (
            isApiError(error) &&
            error.status === 422 &&
            error.fieldErrors.length > 0
        ) {
            const mapped = mapCheckoutFieldErrors(
                error.fieldErrors,
            )

            const unmapped =
                unmappedCheckoutFieldErrors(
                    error.fieldErrors,
                )

            setFieldErrors(mapped)

            if (unmapped.length > 0) {
                setFormError(
                    unmapped
                        .map(
                            (entry) =>
                                entry.message,
                        )
                        .join(' '),
                )
            } else {
                setFormError(error.message)
            }

            return
        }

        if (
            isApiError(error) &&
            error.status === 409
        ) {
            await refetchStaleLoanState()

            setFormError(
                'Book is already checked out. The book and loan state were refreshed; your borrower and notes were kept.',
            )
            return
        }

        if (
            isApiError(error) &&
            error.status === 412
        ) {
            await refetchStaleLoanState()

            const detail =
                error.detail ??
                error.message ??
                'Book is display only'

            setFormError(
                `${detail}. The book and loan state were refreshed; your borrower and notes were kept.`,
            )
            return
        }

        if (isBookIdentityError(error)) {
            await refetchStaleLoanState()

            setFormError(
                'This book is missing or no longer available for checkout. The book and loan state were refreshed; your borrower and notes were kept.',
            )
            return
        }

        setFormError(
            isApiError(error)
                ? error.message
                : error instanceof Error
                    ? error.message
                    : 'The book could not be checked out.',
        )
    }

    function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        const errors =
            validateCheckoutFormValues(values)

        setFieldErrors(errors)
        setFormError(null)

        if (Object.keys(errors).length > 0) {
            window.requestAnimationFrame(() => {
                summaryRef.current?.focus()
            })
            return
        }

        if (!isCheckoutEligible(book)) {
            setFormError(
                'This book is no longer available for checkout.',
            )
            return
        }

        const request =
            checkoutFormValuesToRequest(
                values,
                new Date(),
            )

        setFieldErrors({})
        setFormError(null)

        checkoutBook.mutate(
            {
                id: book.book_id,
                request,
            },
            {
                onSuccess: () => {
                    resetForm()
                    onCloseRef.current()
                },
                onError: (error) => {
                    void handleCheckoutError(error)
                },
            },
        )
    }

    return (
        <dialog
            ref={dialogRef}
            className="confirmation-dialog checkout-dialog"
            aria-labelledby={titleId}
        >
            <div className="confirmation-dialog__content">
                <h2 id={titleId}>
                    Check Out
                </h2>

                <p>
                    <strong>{book.title}</strong>
                    {' — '}
                    {formatBookAuthors(
                        book.authors,
                    )}
                </p>

                {hasSummary ? (
                    <div
                        ref={summaryRef}
                        tabIndex={-1}
                        role="alert"
                        className="alert alert--error"
                    >
                        <strong>
                            Checkout could not be completed
                        </strong>

                        {formError ? (
                            <p>{formError}</p>
                        ) : null}

                        {errorEntries.length > 0 ? (
                            <ul>
                                {errorEntries.map(
                                    ([
                                         field,
                                         message,
                                     ]) => (
                                        <li key={field}>
                                            <a
                                                href={`#${FIELD_IDS[field]}`}
                                            >
                                                {
                                                    FIELD_LABELS[
                                                        field
                                                        ]
                                                }
                                                :{' '}
                                                {message}
                                            </a>
                                        </li>
                                    ),
                                )}
                            </ul>
                        ) : null}
                    </div>
                ) : null}

                <form onSubmit={handleSubmit}>
                    <Field
                        label="Borrower"
                        id="checkout-borrower"
                        error={fieldErrors.borrower}
                    >
                        <input
                            id="checkout-borrower"
                            ref={borrowerInputRef}
                            type="text"
                            value={values.borrower}
                            onChange={(event) =>
                                updateField(
                                    'borrower',
                                    event.target.value,
                                )
                            }
                            autoComplete="off"
                            disabled={
                                checkoutBook.isPending
                            }
                        />
                    </Field>

                    <Field
                        label="Notes"
                        id="checkout-notes"
                        error={fieldErrors.notes}
                    >
                        <textarea
                            id="checkout-notes"
                            value={values.notes}
                            onChange={(event) =>
                                updateField(
                                    'notes',
                                    event.target.value,
                                )
                            }
                            disabled={
                                checkoutBook.isPending
                            }
                        />
                    </Field>

                    <div className="confirmation-dialog__actions">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={
                                handleCancelCheckout
                            }
                            disabled={
                                checkoutBook.isPending
                            }
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            variant="primary"
                            disabled={
                                checkoutBook.isPending ||
                                !isCheckoutEligible(
                                    book,
                                )
                            }
                        >
                            {checkoutBook.isPending
                                ? 'Checking Out…'
                                : 'Check Out Book'}
                        </Button>
                    </div>
                </form>
            </div>
        </dialog>
    )
}
