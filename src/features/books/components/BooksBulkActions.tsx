import type {
    BulkShelfMoveResponse,
} from '../../../api/apiTypes'
import { Button } from '../../../components/Button'
import {
    BulkMoveToShelfControl,
} from './BulkMoveToShelfControl'
import { BulkStashControl } from './BulkStashControl'

interface BooksBulkActionsProps {
    selectedBookIds: readonly string[]
    selectedCount: number
    onSelectVisible: () => void
    onClear: () => void
    onExit: () => void
    onMoveSuccess?: (response: BulkShelfMoveResponse) => void
    reviewMode?: boolean
}

export function BooksBulkActions({
                                     selectedBookIds,
                                     selectedCount,
                                     onSelectVisible,
                                     onClear,
                                     onExit,
    onMoveSuccess,
    reviewMode = false,
}: BooksBulkActionsProps) {
    return (
        <section
            className="books-bulk-actions"
            aria-label="Bulk selection"
        >
            <p
                className="books-bulk-actions__count"
                aria-live="polite"
            >
                {selectedCount}{' '}
                {selectedCount === 1
                    ? 'book selected'
                    : 'books selected'}
            </p>

            <div className="books-bulk-actions__controls">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onSelectVisible}
                >
                    Select all loaded books
                </Button>

                <BulkMoveToShelfControl
                    selectedBookIds={selectedBookIds}
                    onSuccess={(response) => {
                        onClear()
                        onMoveSuccess?.(response)
                    }}
                />

                <BulkStashControl
                    selectedBookIds={selectedBookIds}
                    onSuccess={onClear}
                />

                <Button
                    type="button"
                    variant="secondary"
                    onClick={onClear}
                    disabled={selectedCount === 0}
                >
                    Clear selection
                </Button>

                <Button
                    type="button"
                    variant="secondary"
                    onClick={onExit}
                >
                    {reviewMode
                        ? 'Finish Review'
                        : 'Exit selection'}
                </Button>
            </div>
        </section>
    )
}
