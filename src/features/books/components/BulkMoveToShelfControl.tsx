import {
    useId,
    useMemo,
    useState,
} from 'react'

import {
    Alert,
    Button,
    ConfirmationDialog,
} from '../../../components'
import type {
    BulkShelfMoveResponse,
} from '../../../api/apiTypes'
import {
    useBulkMoveBooksToShelf,
} from '../../../api/booksQueries'
import {
    useShelves,
} from '../../../api/shelvesQueries'
import {
    filterAssignableShelves,
    formatShelfCommonNameForDisplay,
    shelfCommonNameById,
} from '../../shelves/shelfDisplay'

export interface BulkMoveToShelfControlProps {
    selectedBookIds: readonly string[]
    onSuccess: (response: BulkShelfMoveResponse) => void
}

function errorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message
    }

    return 'The selected books could not be moved.'
}

export function BulkMoveToShelfControl({
                                           selectedBookIds,
                                           onSuccess,
                                       }: BulkMoveToShelfControlProps) {
    const shelfSelectId = useId()

    const [
        selectedShelfId,
        setSelectedShelfId,
    ] = useState('')

    const [
        confirmationOpen,
        setConfirmationOpen,
    ] = useState(false)

    const [
        error,
        setError,
    ] = useState<string | null>(null)

    const [
        successMessage,
        setSuccessMessage,
    ] = useState<string | null>(null)

    const shelvesQuery = useShelves({
        enabled: selectedBookIds.length > 0,
    })

    const moveMutation =
        useBulkMoveBooksToShelf()

    const assignableShelves = useMemo(
        () =>
            filterAssignableShelves(
                shelvesQuery.data ?? [],
            ),
        [shelvesQuery.data],
    )

    const selectedShelfName =
        shelfCommonNameById(
            assignableShelves,
            selectedShelfId,
        )

    const selectedShelfDisplayName =
        selectedShelfName === undefined
            ? undefined
            : formatShelfCommonNameForDisplay(
                selectedShelfName,
            )

    const selectedCount =
        selectedBookIds.length

    const canPrepareMove =
        selectedCount > 0 &&
        selectedShelfName !== undefined &&
        !moveMutation.isPending

    function handleOpenConfirmation() {
        if (!canPrepareMove) {
            return
        }

        setError(null)
        setSuccessMessage(null)
        setConfirmationOpen(true)
    }

    function handleCancelConfirmation() {
        if (moveMutation.isPending) {
            return
        }

        setConfirmationOpen(false)
        setError(null)
    }

    function handleConfirmMove() {
        if (
            selectedShelfName === undefined ||
            selectedBookIds.length === 0 ||
            moveMutation.isPending
        ) {
            return
        }

        setError(null)

        moveMutation.mutate(
            {
                book_ids: [
                    ...selectedBookIds,
                ],
                shelf_name:
                selectedShelfName,
            },
            {
                onSuccess: (response) => {
                    const destination =
                        formatShelfCommonNameForDisplay(
                            response.shelf_name,
                        )

                    setConfirmationOpen(false)
                    setSelectedShelfId('')
                    setError(null)

                    setSuccessMessage(
                        `${response.moved_count} ${
                            response.moved_count === 1
                                ? 'book'
                                : 'books'
                        } moved to ${destination}.`,
                    )

                    onSuccess(response)
                },
                onError: (mutationError) => {
                    setError(
                        errorMessage(
                            mutationError,
                        ),
                    )
                },
            },
        )
    }

    if (selectedCount === 0) {
        return (
            <div className="books-bulk-move">
                {successMessage ? (
                    <Alert
                        variant="success"
                        title="Books moved"
                    >
                        {successMessage}
                    </Alert>
                ) : null}

                <Button
                    type="button"
                    variant="secondary"
                    disabled
                >
                    Move to Shelf
                </Button>
            </div>
        )
    }

    if (shelvesQuery.isPending) {
        return (
            <div
                className="books-bulk-move"
                role="status"
            >
                Loading shelves…
            </div>
        )
    }

    if (shelvesQuery.isError) {
        return (
            <div className="books-bulk-move">
                <Alert
                    variant="error"
                    title="Unable to load shelves"
                >
                    {errorMessage(
                        shelvesQuery.error,
                    )}
                </Alert>

                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                        void shelvesQuery.refetch()
                    }}
                >
                    Retry shelves
                </Button>
            </div>
        )
    }

    return (
        <div className="books-bulk-move">
            {successMessage ? (
                <Alert
                    variant="success"
                    title="Books moved"
                >
                    {successMessage}
                </Alert>
            ) : null}

            <div className="books-bulk-move__field">
                <label htmlFor={shelfSelectId}>
                    Destination shelf
                </label>

                <select
                    id={shelfSelectId}
                    value={selectedShelfId}
                    disabled={moveMutation.isPending}
                    onChange={(event) => {
                        setSelectedShelfId(
                            event.target.value,
                        )
                        setError(null)
                        setSuccessMessage(null)
                    }}
                >
                    <option value="">
                        Select a shelf
                    </option>

                    {assignableShelves.map(
                        (shelf) => (
                            <option
                                key={shelf.shelf_id}
                                value={shelf.shelf_id}
                            >
                                {formatShelfCommonNameForDisplay(
                                    shelf.common_name,
                                )}
                            </option>
                        ),
                    )}
                </select>
            </div>

            <Button
                type="button"
                variant="primary"
                disabled={!canPrepareMove}
                onClick={
                    handleOpenConfirmation
                }
            >
                Move to Shelf
            </Button>

            <ConfirmationDialog
                open={confirmationOpen}
                title="Confirm shelf move"
                confirmLabel={
                    moveMutation.isPending
                        ? 'Moving…'
                        : 'Move books'
                }
                confirmVariant="primary"
                confirmDisabled={
                    moveMutation.isPending
                }
                cancelDisabled={
                    moveMutation.isPending
                }
                onConfirm={handleConfirmMove}
                onCancel={
                    handleCancelConfirmation
                }
            >
                <p>
                    Move {selectedCount}{' '}
                    {selectedCount === 1
                        ? 'book'
                        : 'books'}{' '}
                    to{' '}
                    <strong>
                        {selectedShelfDisplayName ??
                            'the selected shelf'}
                    </strong>
                    ?
                </p>

                {error ? (
                    <Alert
                        variant="error"
                        title="Unable to move books"
                    >
                        {error}
                    </Alert>
                ) : null}
            </ConfirmationDialog>
        </div>
    )
}
