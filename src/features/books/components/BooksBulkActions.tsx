import { Button } from '../../../components/Button'

interface BooksBulkActionsProps {
    selectedCount: number
    onSelectVisible: () => void
    onClear: () => void
    onExit: () => void
}

export function BooksBulkActions({
                                     selectedCount,
                                     onSelectVisible,
                                     onClear,
                                     onExit,
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
                    Exit selection
                </Button>
            </div>
        </section>
    )
}
