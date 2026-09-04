import { useState } from 'react'
import type { FormEvent } from 'react'

import { Alert, Button, Field } from '../../../components'
import {
    formatApiQueryError,
    isApiError,
} from '../../../api/apiErrors'
import type { LoanRead } from '../../../api/apiTypes'
import { useUpdateLoan } from '../../../api/loansQueries'
import { validateBorrower } from '../borrowerEditModel'

interface EditLoanBorrowerProps {
    loan: LoanRead
}

export function EditLoanBorrower({
    loan,
}: EditLoanBorrowerProps) {
    const updateLoan = useUpdateLoan()
    const [isEditing, setIsEditing] = useState(false)
    const [borrower, setBorrower] = useState(loan.borrower)
    const [fieldError, setFieldError] = useState<string | undefined>()
    const [formError, setFormError] = useState<string | null>(null)

    function cancelEditing() {
        setBorrower(loan.borrower)
        setFieldError(undefined)
        setFormError(null)
        setIsEditing(false)
    }

    function submitBorrower(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        if (updateLoan.isPending) {
            return
        }

        const errors = validateBorrower(borrower)

        if (errors.borrower) {
            setFieldError(errors.borrower)
            setFormError('Fix the highlighted field and try again.')
            return
        }

        setFieldError(undefined)
        setFormError(null)

        updateLoan.mutate(
            {
                id: loan.id,
                update: {
                    borrower,
                },
            },
            {
                onSuccess: () => {
                    setIsEditing(false)
                },
                onError: (error) => {
                    if (isApiError(error)) {
                        const borrowerError = error.fieldErrors.find(
                            (entry) => entry.field === 'borrower',
                        )

                        if (borrowerError) {
                            setFieldError(borrowerError.message)
                            setFormError(error.message)
                            return
                        }

                        if (error.status === 404) {
                            setFormError(
                                'This loan could not be found. Refresh the loan history and try again.',
                            )
                            return
                        }

                        if (error.status === 400) {
                            setFormError(
                                error.detail ?? 'This loan has an invalid identifier.',
                            )
                            return
                        }
                    }

                    setFormError(formatApiQueryError(error))
                },
            },
        )
    }

    if (!isEditing) {
        return (
            <Button
                type="button"
                variant="secondary"
                onClick={() => {
                    setBorrower(loan.borrower)
                    setIsEditing(true)
                }}
            >
                Edit Borrower
            </Button>
        )
    }

    return (
        <form
            className="loan-borrower-form"
            onSubmit={submitBorrower}
        >
            {formError ? (
                <Alert variant="error">
                    {formError}
                </Alert>
            ) : null}

            <Field
                label="Borrower"
                error={fieldError}
            >
                <input
                    type="text"
                    value={borrower}
                    maxLength={255}
                    required
                    disabled={updateLoan.isPending}
                    onChange={(event) => {
                        setBorrower(event.target.value)
                        setFieldError(undefined)
                    }}
                />
            </Field>

            <div className="form-actions">
                <Button
                    type="submit"
                    variant="primary"
                    disabled={updateLoan.isPending}
                >
                    {updateLoan.isPending
                        ? 'Saving…'
                        : 'Save Borrower'}
                </Button>

                <Button
                    type="button"
                    variant="secondary"
                    disabled={updateLoan.isPending}
                    onClick={cancelEditing}
                >
                    Cancel
                </Button>
            </div>
        </form>
    )
}
