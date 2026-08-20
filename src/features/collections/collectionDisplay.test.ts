import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    collectionBookWishlistClassName,
    displayCollectionBookLocation,
    displayCollectionBookNotes,
    displayCollectionBookPosition,
} from './collectionDisplay'

describe('collectionDisplay', () => {
    it('formats membership position', () => {
        expect(
            displayCollectionBookPosition(3),
        ).toBe('3')
    })

    it('formats shelf common names for shelved books', () => {
        expect(
            displayCollectionBookLocation(
                'living_room',
                false,
            ),
        ).toBe('Living Room')

        expect(
            displayCollectionBookLocation(
                'a1',
                false,
            ),
        ).toBe('A1')
    })

    it('shows Wishlist for wishlisted memberships', () => {
        expect(
            displayCollectionBookLocation(
                null,
                true,
            ),
        ).toBe('Wishlist')

        expect(
            displayCollectionBookLocation(
                'unknown',
                true,
            ),
        ).toBe('Wishlist')
    })

    it('falls back to Unknown when a shelved location is absent', () => {
        expect(
            displayCollectionBookLocation(
                null,
                false,
            ),
        ).toBe('Unknown')

        expect(
            displayCollectionBookLocation(
                '   ',
                false,
            ),
        ).toBe('Unknown')
    })

    it('returns wishlist emphasis only for wishlist memberships', () => {
        expect(
            collectionBookWishlistClassName(
                true,
            ),
        ).toBe(
            'collection-membership--wishlist',
        )

        expect(
            collectionBookWishlistClassName(
                false,
            ),
        ).toBeUndefined()
    })

    it('trims notes and hides empty values', () => {
        expect(
            displayCollectionBookNotes(
                '  Featured copy  ',
            ),
        ).toBe('Featured copy')

        expect(
            displayCollectionBookNotes('   '),
        ).toBeNull()

        expect(
            displayCollectionBookNotes(null),
        ).toBeNull()
    })
})
