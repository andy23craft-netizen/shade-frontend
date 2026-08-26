import {
    describe,
    expect,
    it,
} from 'vitest'

import type {
    WishlistBookRead,
    WishlistRead,
} from '../../../api/apiTypes'
import {
    emptyMoveWishlistBookFormValues,
    membershipToWishlistBookCreate,
    validateMoveWishlistBookFormValues,
} from './moveWishlistBookModel'

const wishlists: WishlistRead[] = [
    {
        wishlist_id: 'wishlist-1',
        name: 'Master List',
        description: null,
        created_date: '2026-08-01T00:00:00Z',
        last_updated_date:
            '2026-08-01T00:00:00Z',
    },
    {
        wishlist_id: 'wishlist-2',
        name: 'Fiction',
        description: null,
        created_date: '2026-08-02T00:00:00Z',
        last_updated_date:
            '2026-08-02T00:00:00Z',
    },
]

const membership: WishlistBookRead = {
    wishlist_book_id: 'membership-1',
    wishlist_id: 'wishlist-1',
    book_id: 'book-1',
    status: 'wanted',
    priority: 2,
    notes: 'Hardcover if possible',
    url: 'https://example.com/book',
    created_date: '2026-08-03T00:00:00Z',
}

describe(
    'validateMoveWishlistBookFormValues',
    () => {
        it('requires a destination wishlist', () => {
            expect(
                validateMoveWishlistBookFormValues(
                    emptyMoveWishlistBookFormValues,
                    'wishlist-1',
                    wishlists,
                ),
            ).toEqual({
                destinationWishlistId:
                    'Choose a destination wishlist.',
            })
        })

        it('rejects the source wishlist', () => {
            expect(
                validateMoveWishlistBookFormValues(
                    {
                        destinationWishlistId:
                            'wishlist-1',
                    },
                    'wishlist-1',
                    wishlists,
                ),
            ).toEqual({
                destinationWishlistId:
                    'Choose a different wishlist.',
            })
        })

        it('rejects an unknown wishlist', () => {
            expect(
                validateMoveWishlistBookFormValues(
                    {
                        destinationWishlistId:
                            'does-not-exist',
                    },
                    'wishlist-1',
                    wishlists,
                ),
            ).toEqual({
                destinationWishlistId:
                    'Choose a valid wishlist.',
            })
        })

        it('accepts another existing wishlist', () => {
            expect(
                validateMoveWishlistBookFormValues(
                    {
                        destinationWishlistId:
                            'wishlist-2',
                    },
                    'wishlist-1',
                    wishlists,
                ),
            ).toEqual({})
        })
    },
)

describe('membershipToWishlistBookCreate', () => {
    it('preserves transferable membership metadata', () => {
        expect(
            membershipToWishlistBookCreate(
                membership,
            ),
        ).toEqual({
            book_id: 'book-1',
            status: 'wanted',
            priority: 2,
            notes: 'Hardcover if possible',
            url: 'https://example.com/book',
        })
    })

    it('preserves nullable membership metadata', () => {
        expect(
            membershipToWishlistBookCreate({
                ...membership,
                priority: null,
                notes: null,
                url: null,
            }),
        ).toEqual({
            book_id: 'book-1',
            status: 'wanted',
            priority: null,
            notes: null,
            url: null,
        })
    })
})
