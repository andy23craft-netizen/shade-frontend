import type {
    BulkStashApplyResponse,
} from '../../api/apiTypes'

export interface PlacementReconciliationResult {
    source: string
    placedBookIds: string[]
    placedCount: number
    destinationShelf: string
    destinationPreexistingCount: number
    destinationWasOccupied: boolean
}

export function reconciliationFromApplyStash(
    response: BulkStashApplyResponse,
): PlacementReconciliationResult {
    return {
        source: 'apply-stash',
        placedBookIds: response.book_ids,
        placedCount: response.applied_count,
        destinationShelf:
            response.destination_shelf,
        destinationPreexistingCount:
            response.destination_preexisting_count,
        destinationWasOccupied:
            response.destination_was_occupied,
    }
}

export function shouldReconcilePlacement(
    result: PlacementReconciliationResult,
): boolean {
    return result.placedCount >= 2 &&
        result.destinationPreexistingCount > 0 &&
        result.destinationWasOccupied
}

