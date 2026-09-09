import { useState } from 'react'

import { Alert, AppLink, Button } from '../../../components'
import { isApiError } from '../../../api/apiErrors'
import { useSetBookAvailability } from '../../../api/booksQueries'
import { useLibrarySettings } from '../../../api/libraryQueries'
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
    onSuccess,
}: {
    book: BookRead
    hasActiveLoan: boolean
    onSuccess?: () => void
}) {
    const [status, setStatus] = useState<Status>(book.status)
    const [pickupName, setPickupName] = useState('')
    const [reservationNote, setReservationNote] = useState('')
    const [message, setMessage] = useState<string | null>(null)
    const mutation = useSetBookAvailability()
    const settingsQuery = useLibrarySettings()
    const selectable = MANUAL_STATUSES.includes(book.status)
    const reserveShelfMissing =
        settingsQuery.isSuccess &&
        settingsQuery.data.reserved_shelf_id === null

    function submit() {
        if (status === book.status || hasActiveLoan) return
        if (status === 'reserved' && pickupName.trim() === '') {
            setMessage('A pickup name is required to reserve a book.')
            return
        }

        mutation.mutate(
            {
                id: book.book_id,
                request: {
                    status,
                    ...(status === 'reserved'
                        ? {
                            reservation: {
                                pickup_name: pickupName.trim(),
                                ...(reservationNote.trim() === ''
                                    ? {}
                                    : { note: reservationNote.trim() }),
                            },
                        }
                        : {}),
                },
            },
            {
                onSuccess: (updated) => {
                    setStatus(updated.status)
                    setMessage(`Availability changed to ${LABELS[updated.status] ?? updated.status}.`)
                    onSuccess?.()
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
                    {reserveShelfMissing ? (
                        <Alert variant="warning" title="Reserved shelf needed">
                            Choose a Reserved / will-call shelf in{' '}
                            <AppLink to="/library/settings">Library Settings</AppLink>{' '}
                            before reserving a book.
                        </Alert>
                    ) : null}
                    {settingsQuery.isError ? (
                        <Alert variant="warning" title="Reservation settings unavailable">
                            The Reserved shelf could not be confirmed. You can retry loading settings, or choose another availability status.
                            <Button type="button" variant="secondary" onClick={() => void settingsQuery.refetch()}>
                                Retry settings
                            </Button>
                        </Alert>
                    ) : null}
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
                            <option key={value} value={value} disabled={value === 'reserved' && reserveShelfMissing}>{LABELS[value]}</option>
                        ))}
                    </select>
                    {status === 'reserved' ? (
                        <div className="book-availability-control__reservation">
                            <label htmlFor="book-reservation-pickup-name">Pickup name</label>
                            <input
                                id="book-reservation-pickup-name"
                                value={pickupName}
                                disabled={mutation.isPending}
                                onChange={(event) => {
                                    setPickupName(event.target.value)
                                    setMessage(null)
                                }}
                            />
                            <label htmlFor="book-reservation-note">Reservation note (optional)</label>
                            <textarea
                                id="book-reservation-note"
                                value={reservationNote}
                                disabled={mutation.isPending}
                                onChange={(event) => setReservationNote(event.target.value)}
                            />
                        </div>
                    ) : null}
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
