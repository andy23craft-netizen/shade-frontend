import { useState } from 'react'

import { Alert, Button } from '../../../components'
import { isApiError } from '../../../api/apiErrors'
import { useSetBookAvailability } from '../../../api/booksQueries'
import type { BookRead, Status } from '../../../api/apiTypes'

const MANUAL_STATUSES: readonly Status[] = [
    'available',
    'reserved',
    'reading',
    'missing',
    'display_only',
]

const LABELS: Record<string, string> = {
    available: 'Available',
    reserved: 'Reserved',
    reading: 'Reading',
    missing: 'Missing',
    display_only: 'Display Only',
}

export function BookAvailabilityControl({
    book,
    hasActiveLoan,
}: {
    book: BookRead
    hasActiveLoan: boolean
}) {
    const [status, setStatus] = useState<Status>(book.status)
    const [message, setMessage] = useState<string | null>(null)
    const mutation = useSetBookAvailability()
    const selectable = MANUAL_STATUSES.includes(book.status)

    function submit() {
        if (status === book.status || hasActiveLoan) return

        mutation.mutate(
            { id: book.book_id, request: { status } },
            {
                onSuccess: (updated) => {
                    setStatus(updated.status)
                    setMessage(`Availability changed to ${LABELS[updated.status] ?? updated.status}.`)
                },
                onError: (error) => {
                    const detail = isApiError(error) ? error.detail ?? error.message : null
                    setMessage(detail ?? 'Availability could not be changed. The latest book state was requested.')
                },
            },
        )
    }

    return (
        <section className="book-details-panel" aria-labelledby="book-availability-heading">
            <h2 id="book-availability-heading">Availability</h2>
            {hasActiveLoan || !selectable ? (
                <p>Availability cannot be changed while this copy is on loan.</p>
            ) : (
                <div className="book-availability-control">
                    <label htmlFor="book-availability-status">Set availability</label>
                    <select
                        id="book-availability-status"
                        value={status}
                        disabled={mutation.isPending}
                        onChange={(event) => {
                            setStatus(event.target.value as Status)
                            setMessage(null)
                        }}
                    >
                        {MANUAL_STATUSES.map((value) => (
                            <option key={value} value={value}>{LABELS[value]}</option>
                        ))}
                    </select>
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={mutation.isPending || status === book.status}
                        onClick={submit}
                    >
                        {mutation.isPending ? 'Saving…' : 'Update availability'}
                    </Button>
                </div>
            )}
            {message ? (
                <Alert variant={mutation.isError ? 'error' : 'success'}>{message}</Alert>
            ) : null}
        </section>
    )
}
