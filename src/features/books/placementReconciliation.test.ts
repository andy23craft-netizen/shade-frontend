import { describe, expect, it } from 'vitest'
import {
    reconciliationFromApplyStash,
    shouldReconcilePlacement,
} from './placementReconciliation'

describe('placement reconciliation', () => {
    it('maps authoritative Apply Stash occupancy', () => {
        const result = reconciliationFromApplyStash({
            applied_count: 2,
            book_ids: ['book-1', 'book-2'],
            destination_shelf: 'e4',
            destination_preexisting_count: 31,
            destination_was_occupied: true,
        })

        expect(result).toEqual({
            source: 'apply-stash',
            placedBookIds: ['book-1', 'book-2'],
            placedCount: 2,
            destinationShelf: 'e4',
            destinationPreexistingCount: 31,
            destinationWasOccupied: true,
        })
        expect(shouldReconcilePlacement(result)).toBe(true)
    })

    it('does not prompt for one book or an empty destination', () => {
        const base = {
            source: 'apply-stash',
            placedBookIds: ['book-1'],
            placedCount: 1,
            destinationShelf: 'e4',
            destinationPreexistingCount: 5,
            destinationWasOccupied: true,
        }

        expect(shouldReconcilePlacement(base)).toBe(false)
        expect(shouldReconcilePlacement({
            ...base,
            placedBookIds: ['book-1', 'book-2'],
            placedCount: 2,
            destinationPreexistingCount: 0,
            destinationWasOccupied: false,
        })).toBe(false)
    })
})

