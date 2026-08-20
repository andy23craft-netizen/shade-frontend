import {
    describe,
    expect,
    it,
} from 'vitest'

import type {
    ShelfRead,
} from '../../api/apiTypes'
import {
    emptyMoveWishlistBookFormValues,
    shelfIdToShelfNameUpdate,
    validateMoveWishlistBookFormValues,
} from './moveWishlistBookModel'

const shelves: ShelfRead[] = [
    {
        shelf_id: 'shelf-a1',
        common_name: 'a1',
        description: null,
        location: null,
        created_date: '2026-08-01T00:00:00Z',
        updated_date: '2026-08-01T00:00:00Z',
    },
    {
        shelf_id: 'shelf-unknown',
        common_name: 'unknown',
        description: null,
        location: null,
        created_date: '2026-08-01T00:00:00Z',
        updated_date: '2026-08-01T00:00:00Z',
    },
    {
        shelf_id: 'shelf-removed',
        common_name: 'removed',
        description: null,
        location: null,
        created_date: '2026-08-01T00:00:00Z',
        updated_date: '2026-08-01T00:00:00Z',
    },
]

describe('validateMoveWishlistBookFormValues', () => {
    it('requires an explicit shelf selection', () => {
        expect(
            validateMoveWishlistBookFormValues(
                emptyMoveWishlistBookFormValues,
            ),
        ).toEqual({
            shelfId: 'Choose a shelf.',
        })
    })

    it('accepts a selected shelf id', () => {
        expect(
            validateMoveWishlistBookFormValues({
                shelfId: 'shelf-a1',
            }),
        ).toEqual({})
    })
})

describe('shelfIdToShelfNameUpdate', () => {
    it('converts a shelf id to a shelf-name-only update', () => {
        expect(
            shelfIdToShelfNameUpdate(
                'shelf-a1',
                shelves,
            ),
        ).toEqual({
            shelf_name: 'a1',
        })
    })

    it('allows the unknown shelf', () => {
        expect(
            shelfIdToShelfNameUpdate(
                'shelf-unknown',
                shelves,
            ),
        ).toEqual({
            shelf_name: 'unknown',
        })
    })

    it('rejects an empty shelf id', () => {
        expect(() =>
            shelfIdToShelfNameUpdate(
                '',
                shelves,
            ),
        ).toThrow(
            'Choose a shelf before adding the book to the collection.',
        )
    })

    it('rejects an unknown shelf id', () => {
        expect(() =>
            shelfIdToShelfNameUpdate(
                'does-not-exist',
                shelves,
            ),
        ).toThrow(
            'Choose a valid shelf.',
        )
    })

    it('rejects the removed shelf', () => {
        expect(() =>
            shelfIdToShelfNameUpdate(
                'shelf-removed',
                shelves,
            ),
        ).toThrow(
            'Choose a shelf that can hold books.',
        )
    })
})
