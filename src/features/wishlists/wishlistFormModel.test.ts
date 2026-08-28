import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    emptyAddWishlistBookFormValues,
    formValuesToUnshelvedBookCreate,
    formValuesToWishlistCreate,
    validateAddWishlistBookFormValues,
    validateWishlistCreateFormValues,
    type AddWishlistBookFormValues,
} from './wishlistFormModel'

describe('validateWishlistCreateFormValues', () => {
    it('requires a non-blank name', () => {
        expect(
            validateWishlistCreateFormValues({
                name: '  ',
                description: '',
            }),
        ).toEqual({
            name: 'Enter a name for the wishlist.',
        })
    })

    it('rejects names longer than 255 characters', () => {
        expect(
            validateWishlistCreateFormValues({
                name: 'a'.repeat(256),
                description: '',
            }).name,
        ).toBe('Name must be 255 characters or fewer.')
    })
})

describe('formValuesToWishlistCreate', () => {
    it('trims name and converts blank description to null', () => {
        expect(
            formValuesToWishlistCreate({
                name: '  TBR  ',
                description: '  ',
            }),
        ).toEqual({
            name: 'TBR',
            description: null,
        })
    })
})

describe('validateAddWishlistBookFormValues', () => {
    it('requires a wishlist, title, and authors', () => {
        expect(
            validateAddWishlistBookFormValues(
                emptyAddWishlistBookFormValues,
            ),
        ).toEqual({
            wishlistId: 'Choose a wishlist.',
            title: 'Enter a title.',
            authors: 'Enter the authors.',
        })
    })

    it('rejects an invalid ISBN when one is supplied', () => {
        expect(
            validateAddWishlistBookFormValues({
                wishlistId: 'wishlist-1',
                title: 'A Book',
                authors: 'An Author',
                isbn13: '123',
                status: 'wanted',
            }).isbn13,
        ).toBe('Enter a valid ISBN-10 or ISBN-13.')
    })

    it('rejects an unsupported membership status', () => {
        expect(
            validateAddWishlistBookFormValues({
                wishlistId: 'wishlist-1',
                title: 'A Book',
                authors: 'An Author',
                isbn13: '',
                status: 'mystery' as AddWishlistBookFormValues['status'],
            }).status,
        ).toBe('Choose a valid membership status.')
    })
})

describe('formValuesToUnshelvedBookCreate', () => {
    it('omits shelf_name from the create payload', () => {
        const payload = formValuesToUnshelvedBookCreate({
            wishlistId: 'wishlist-1',
            title: 'A Book',
            authors: 'An Author',
            isbn13: '',
            status: 'wanted',
        }, [
            'author-an-author',
        ])

        expect(payload).toEqual({
            title: 'A Book',
            author_ids: ['author-an-author'],
            category_ids: [],
            is_read: false,
            status: 'available',
        })
        expect(payload).not.toHaveProperty(
            'shelf_name',
        )
    })

    it('includes a trimmed ISBN when supplied', () => {
        const payload = formValuesToUnshelvedBookCreate({
            wishlistId: 'wishlist-1',
            title: 'A Book',
            authors: 'An Author',
            isbn13: '  9780441172719  ',
            status: 'wanted',
        }, [
            'author-an-author',
        ])

        expect(payload.isbn13).toBe('9780441172719')
        expect(payload).not.toHaveProperty(
            'shelf_name',
        )
    })
})
