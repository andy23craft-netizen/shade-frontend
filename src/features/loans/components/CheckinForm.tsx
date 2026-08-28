import {
    useEffect,
    useRef,
    useState,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { formatBookAuthors } from '../../books/authorDisplay'
import { ConfirmationDialog } from '../../../components'
import { Button } from '../../../components/Button'
import { Field } from '../../../components/Field'
import {
    isApiError,
    type ApiFieldError,
} from '../../../api/apiErrors'
import {
    isBookIdentityError,
} from '../../../api/bookIdentity'
import type {
    BookRead,
    LoanRead,
} from '../../../api/apiTypes'
import {
    useCheckinBook,
} from '../../../api/booksQueries'
import { queryKeys } from '../../../api/queryKeys'
import {
    isCheckinEligible,
} from '../checkinEligibility'
import {
    checkinFormDefaults,
    checkinFormValuesToRequest,
    validateCheckinFormValues,
    type CheckinFormFieldErrors,
    type CheckinFormValues,
} from '../checkinModel'

interface CheckinFormProps {
    book: BookRead
    loans: readonly LoanRead[]
    onCancel: () => void
    onSuccess: () => void
}

function focusSummary(
    node: HTMLDivElement | null,
) {
    node?.focus()
}

const CHECKIN_FORM_FIELDS = new Set<string>([
    'returned_at',
])

function mapCheckinFieldErrors(
    fieldErrors: readonly ApiFieldError[],
): CheckinFormFieldErrors {
    const mapped: CheckinFormFieldErrors = {}

    for (const entry of fieldErrors) {
        const field =
            entry.field.split('.')[0]

        if (
            !field ||
            !CHECKIN_FORM_FIELDS.has(field) ||
            mapped[
                field as keyof CheckinFormFieldErrors
                ]
        ) {
            continue
        }

        mapped[
            field as keyof CheckinFormFieldErrors
            ] = entry.message
    }

    return mapped
}

export function CheckinForm({
                                book,
                                loans,
                                onCancel,
                                onSuccess,
                            }: CheckinFormProps) {
    const queryClient = useQueryClient()
    const checkinBook = useCheckinBook()

    const summaryRef =
        useRef<HTMLDivElement>(null)

    const [
        values,
        setValues,
    ] = useState<CheckinFormValues>(
        checkinFormDefaults,
    )

    const [
        fieldErrors,
        setFieldErrors,
    ] = useState<CheckinFormFieldErrors>({})

    const [
        formError,
        setFormError,
    ] = useState<string | null>(null)

    const [
        pendingCheckinRequest,
        setPendingCheckinRequest,
    ] = useState<
        ReturnType<
            typeof checkinFormValuesToRequest
        > | null
    >(null)

    const [
        isConfirmationOpen,
        setIsConfirmationOpen,
    ] = useState(false)

    const activeLoan = loans.find(
        (loan) =>
            loan.book_id === book.id &&
            loan.returned_at === null,
    )

    const errorEntries = (
        Object.entries(fieldErrors) as [
            keyof CheckinFormFieldErrors,
            string,
        ][]
    ).filter(
        (
            entry,
        ): entry is [
            keyof CheckinFormFieldErrors,
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

        focusSummary(summaryRef.current)
    }, [
        formError,
        fieldErrors,
        hasSummary,
    ])

    async function refetchStaleLoanState() {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey:
                    queryKeys.books.detail(book.id),
            }),
            queryClient.invalidateQueries({
                queryKey: queryKeys.books.all,
            }),
            queryClient.invalidateQueries({
                queryKey: queryKeys.loans.all,
            }),
        ])
    }

    function updateReturnedAt(
        value: string,
    ) {
        setValues({
            returned_at: value,
        })

        setFieldErrors((current) => {
            if (!current.returned_at) {
                return current
            }

            const next = {
                ...current,
            }

            delete next.returned_at

            return next
        })

        setFormError(null)
    }

    function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        const errors =
            validateCheckinFormValues(values)

        setFieldErrors(errors)
        setFormError(null)

        if (Object.keys(errors).length > 0) {
            return
        }

        if (
            !isCheckinEligible(
                book,
                loans,
            )
        ) {
            setFormError(
                'This book does not currently have an active loan.',
            )
            return
        }

        const request =
            checkinFormValuesToRequest(values)

        setPendingCheckinRequest(request)
        setIsConfirmationOpen(true)
    }

    function handleConfirmCheckin() {
        if (pendingCheckinRequest === null) {
            return
        }

        if (
            !isCheckinEligible(
                book,
                loans,
            )
        ) {
            setIsConfirmationOpen(false)
            setPendingCheckinRequest(null)
            setFormError(
                'This book does not currently have an active loan.',
            )
            return
        }

        setIsConfirmationOpen(false)

        checkinBook.mutate(
            {
                id: book.id,
                request: pendingCheckinRequest,
            },
            {
                onSuccess,
                onError: (error) => {
                    void handleCheckinError(error)
                },
            },
        )
    }

    function handleCancelCheckin() {
        setIsConfirmationOpen(false)
    }

    async function handleCheckinError(
        error: unknown,
    ) {
        if (
            isApiError(error) &&
            error.status === 422
        ) {
            const mappedErrors =
                mapCheckinFieldErrors(
                    error.fieldErrors,
                )

            setFieldErrors(mappedErrors)

            setFormError(
                Object.keys(mappedErrors).length === 0
                    ? error.message
                    : null,
            )

            return
        }

        if (isBookIdentityError(error)) {
            await refetchStaleLoanState()

            setFormError(
                'This book or loan could not be found. The book and loan state were refreshed; your return date was kept.',
            )
            return
        }

        if (
            isApiError(error) &&
            error.status === 409
        ) {
            await refetchStaleLoanState()

            setFormError(
                error.detail ===
                'Book is not checked out'
                    ? 'Book is not checked out. The book and loan state were refreshed; your return date was kept.'
                    : error.message,
            )
            return
        }

        setFormError(
            isApiError(error)
                ? error.message
                : error instanceof Error
                    ? error.message
                    : 'The book could not be checked in.',
        )
    }

    return (
        <>
            {hasSummary ? (
                <div
                    ref={summaryRef}
                    tabIndex={-1}
                    role="alert"
                    className="alert alert--error"
                >
                    <strong>
                        {formError
                            ? 'Check-in failed'
                            : 'Fix the following errors'}
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
                                        <a href="#checkin-returned-at">
                                            Return date and
                                            time: {message}
                                        </a>
                                    </li>
                                ),
                            )}
                        </ul>
                    ) : null}
                </div>
            ) : null}

            <form
                className="circulation-card"
                onSubmit={handleSubmit}
                noValidate
            >
                <header className="circulation-card__heading">
                    <div>
                        <p className="circulation-card__eyebrow">
                            Shade Library
                        </p>

                        <h2>Return Card</h2>
                    </div>

                    <p className="circulation-card__number">
                        Check-In Record
                    </p>
                </header>

                <section className="circulation-card__book">
                    <div className="circulation-card__book-heading">
                        <p className="circulation-card__stamp">
                            On Loan
                        </p>

                        <h3>{book.title}</h3>

                        <p>{formatBookAuthors(book.authors)}</p>
                    </div>

                    <dl className="circulation-card__metadata">
                        <div>
                            <dt>Borrower</dt>
                            <dd>
                                {activeLoan?.borrower ??
                                    'Not provided'}
                            </dd>
                        </div>

                        <div>
                            <dt>Checked Out</dt>
                            <dd>
                                {activeLoan?.checked_out_at ??
                                    'Not provided'}
                            </dd>
                        </div>
                    </dl>
                </section>

                <Field
                    label="Return date and time"
                    id="checkin-returned-at"
                    helpText="Leave blank to use the server's current UTC time."
                    error={
                        fieldErrors.returned_at
                    }
                >
                    <input
                        id="checkin-returned-at"
                        type="datetime-local"
                        value={
                            values.returned_at
                        }
                        onChange={(event) =>
                            updateReturnedAt(
                                event.target.value,
                            )
                        }
                    />
                </Field>

                <div className="circulation-card__actions">
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={
                            checkinBook.isPending
                        }
                    >
                        {checkinBook.isPending
                            ? 'Checking In...'
                            : 'Check In Book'}
                    </Button>

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                        disabled={
                            checkinBook.isPending
                        }
                    >
                        Cancel
                    </Button>
                </div>
            </form>

            <ConfirmationDialog
                open={isConfirmationOpen}
                title="Confirm check-in"
                confirmLabel="Confirm check-in"
                onConfirm={handleConfirmCheckin}
                onCancel={handleCancelCheckin}
            >
                Are you sure you want to check in this book?
            </ConfirmationDialog>
        </>
    )
}
