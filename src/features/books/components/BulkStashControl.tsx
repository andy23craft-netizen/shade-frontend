import { useState } from 'react'
import {
    Alert,
    Button,
    ConfirmationDialog,
} from '../../../components'
import {
    useBulkStashBooks,
} from '../../../api/booksQueries'

export function BulkStashControl({
    selectedBookIds,
    onSuccess,
}: {
    selectedBookIds: readonly string[]
    onSuccess: () => void
}) {
    const mutation = useBulkStashBooks()
    const [open, setOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)

    return (
        <>
            <Button
                type="button"
                variant="secondary"
                disabled={selectedBookIds.length === 0 || mutation.isPending}
                onClick={() => {
                    setError(null)
                    setOpen(true)
                }}
            >
                Stash Books
            </Button>

            <ConfirmationDialog
                open={open}
                title="Stash selected books?"
                confirmLabel={mutation.isPending ? 'Stashing…' : 'Stash books'}
                cancelLabel="Cancel"
                confirmVariant="primary"
                confirmDisabled={mutation.isPending}
                cancelDisabled={mutation.isPending}
                onCancel={() => setOpen(false)}
                onConfirm={() => {
                    mutation.mutate(
                        { book_ids: [...selectedBookIds] },
                        {
                            onSuccess: () => {
                                setOpen(false)
                                onSuccess()
                            },
                            onError: (failure) => {
                                setError(
                                    failure instanceof Error
                                        ? failure.message
                                        : 'The selected books could not be stashed.',
                                )
                            },
                        },
                    )
                }}
            >
                <p>
                    Stash {selectedBookIds.length}{' '}
                    {selectedBookIds.length === 1 ? 'book' : 'books'} for later placement?
                </p>
                {error ? (
                    <Alert variant="error" title="Unable to stash books">
                        {error}
                    </Alert>
                ) : null}
            </ConfirmationDialog>
        </>
    )
}
