import {
    ConfirmationDialog,
} from '../../../components'
import {
    formatShelfCommonNameForDisplay,
} from '../../shelves/shelfDisplay'
import type {
    PlacementReconciliationResult,
} from '../placementReconciliation'

export function PlacementReconciliationDialog({
    result,
    onDone,
    onReview,
}: {
    result: PlacementReconciliationResult | null
    onDone: () => void
    onReview: (shelfName: string) => void
}) {
    const shelf = result
        ? formatShelfCommonNameForDisplay(
            result.destinationShelf,
        )
        : ''

    return (
        <ConfirmationDialog
            open={result !== null}
            title="Review destination shelf?"
            confirmLabel={`Review ${shelf}`}
            cancelLabel="Done"
            confirmVariant="primary"
            onConfirm={() => {
                if (result) {
                    onReview(
                        result.destinationShelf,
                    )
                }
            }}
            onCancel={onDone}
        >
            {result ? (
                <p>
                    You moved {result.placedCount}{' '}
                    {result.placedCount === 1
                        ? 'book'
                        : 'books'}{' '}
                    to {shelf}. {shelf} already
                    contained{' '}
                    {result.destinationPreexistingCount}{' '}
                    {result.destinationPreexistingCount === 1
                        ? 'book'
                        : 'books'}
                    . Do you need to move or stash any
                    books from {shelf}?
                </p>
            ) : null}
        </ConfirmationDialog>
    )
}

