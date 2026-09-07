import { useState } from 'react'

import { Alert, Button, ConfirmationDialog } from '../../../components'
import { isApiError } from '../../../api/apiErrors'
import { useSetBulkBookAvailability } from '../../../api/booksQueries'
import type { Status } from '../../../api/apiTypes'

const OPTIONS: Array<{ value: Status; label: string }> = [
    { value: 'available', label: 'Available' },
    { value: 'reserved', label: 'Reserved' },
    { value: 'reading', label: 'Reading' },
    { value: 'missing', label: 'Missing' },
    { value: 'display_only', label: 'Display Only' },
]

export function BulkAvailabilityControl({ selectedBookIds, onSuccess }: {
    selectedBookIds: readonly string[]
    onSuccess: () => void
}) {
    const [status, setStatus] = useState<Status | ''>('')
    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const mutation = useSetBulkBookAvailability()

    function confirm() {
        if (!status || selectedBookIds.length === 0) return
        mutation.mutate(
            { book_ids: [...selectedBookIds], status },
            {
                onSuccess: (response) => {
                    setOpen(false)
                    setStatus('')
                    setMessage(`${response.updated_count} ${response.updated_count === 1 ? 'book' : 'books'} updated.`)
                    onSuccess()
                },
                onError: (error) => {
                    setMessage(isApiError(error) ? error.detail ?? error.message : 'No books were changed. Refresh and try again.')
                },
            },
        )
    }

    return (
        <div className="books-bulk-availability">
            {message ? <Alert variant={mutation.isError ? 'error' : 'success'}>{message}</Alert> : null}
            <label htmlFor="bulk-book-availability">Availability</label>
            <select
                id="bulk-book-availability"
                value={status}
                disabled={mutation.isPending || selectedBookIds.length === 0}
                onChange={(event) => {
                    setStatus(event.target.value as Status | '')
                    setMessage(null)
                }}
            >
                <option value="">Choose status</option>
                {OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <Button type="button" variant="secondary" disabled={!status || selectedBookIds.length === 0} onClick={() => setOpen(true)}>
                Set availability
            </Button>
            <ConfirmationDialog
                open={open}
                title="Confirm availability change"
                confirmLabel={mutation.isPending ? 'Updating…' : 'Update books'}
                confirmDisabled={mutation.isPending}
                cancelDisabled={mutation.isPending}
                onConfirm={confirm}
                onCancel={() => { if (!mutation.isPending) setOpen(false) }}
            >
                <p>Set {selectedBookIds.length} {selectedBookIds.length === 1 ? 'book' : 'books'} to <strong>{OPTIONS.find((option) => option.value === status)?.label}</strong>?</p>
                <p>This is one atomic change. If any selected copy is ineligible, none will be changed.</p>
                {message && mutation.isError ? <Alert variant="error">{message}</Alert> : null}
            </ConfirmationDialog>
        </div>
    )
}
