import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    emptyAddCollectionBookFormValues,
    emptyCollectionCreateFormValues,
    formValuesToCollectionBookCreate,
    formValuesToCollectionCreate,
    validateAddCollectionBookFormValues,
    validateCollectionCreateFormValues,
} from './collectionFormModel'

describe('collectionFormModel', () => {
    describe('collection create form', () => {
        it('requires a non-blank name', () => {
            expect(
                validateCollectionCreateFormValues({
                    ...emptyCollectionCreateFormValues,
                    name: '   ',
                }),
            ).toEqual({
                name:
                    'Enter a name for the collection.',
            })
        })

        it('rejects names longer than 255 characters', () => {
            expect(
                validateCollectionCreateFormValues({
                    ...emptyCollectionCreateFormValues,
                    name: 'a'.repeat(256),
                }),
            ).toEqual({
                name:
                    'Name must be 255 characters or fewer.',
            })
        })

        it('accepts a valid name', () => {
            expect(
                validateCollectionCreateFormValues({
                    name: 'Staff Picks',
                    description: '',
                }),
            ).toEqual({})
        })

        it('trims create values and converts blank description to null', () => {
            expect(
                formValuesToCollectionCreate({
                    name: '  Staff Picks  ',
                    description: '   ',
                }),
            ).toEqual({
                name: 'Staff Picks',
                description: null,
            })
        })

        it('preserves a non-blank trimmed description', () => {
            expect(
                formValuesToCollectionCreate({
                    name: '  Staff Picks  ',
                    description:
                        '  Favorites from the library  ',
                }),
            ).toEqual({
                name: 'Staff Picks',
                description:
                    'Favorites from the library',
            })
        })
    })

    describe('add collection book form', () => {
        it('requires a collection', () => {
            const errors =
                validateAddCollectionBookFormValues({
                    ...emptyAddCollectionBookFormValues,
                    title: 'The Dispossessed',
                    bookId: 'book-1',
                })

            expect(errors.collectionId).toBe(
                'Choose a collection.',
            )
        })

        it('requires a selected book', () => {
            const errors =
                validateAddCollectionBookFormValues({
                    ...emptyAddCollectionBookFormValues,
                    collectionId:
                        'collection-1',
                    title: 'The Dispossessed',
                })

            expect(errors.bookId).toBe(
                'Choose a book to add.',
            )
        })

        it('requires search input before a book has been selected', () => {
            const errors =
                validateAddCollectionBookFormValues({
                    ...emptyAddCollectionBookFormValues,
                    collectionId:
                        'collection-1',
                })

            expect(errors.title).toBe(
                'Enter an ISBN, title, or author to find a book.',
            )
        })

        it('rejects an invalid ISBN', () => {
            const errors =
                validateAddCollectionBookFormValues({
                    ...emptyAddCollectionBookFormValues,
                    collectionId:
                        'collection-1',
                    isbn13: 'not-an-isbn',
                    bookId: 'book-1',
                })

            expect(errors.isbn13).toBe(
                'Enter a valid ISBN-10 or ISBN-13.',
            )
        })

        it('accepts a selected book found by title', () => {
            expect(
                validateAddCollectionBookFormValues({
                    ...emptyAddCollectionBookFormValues,
                    collectionId:
                        'collection-1',
                    title: 'The Dispossessed',
                    bookId: 'book-1',
                }),
            ).toEqual({})
        })

        it('creates a membership payload with trimmed notes', () => {
            expect(
                formValuesToCollectionBookCreate({
                    ...emptyAddCollectionBookFormValues,
                    collectionId:
                        'collection-1',
                    bookId: '  book-1  ',
                    notes:
                        '  Put this near the top later  ',
                }),
            ).toEqual({
                book_id: 'book-1',
                notes:
                    'Put this near the top later',
            })
        })

        it('omits blank optional notes', () => {
            expect(
                formValuesToCollectionBookCreate({
                    ...emptyAddCollectionBookFormValues,
                    collectionId:
                        'collection-1',
                    bookId: 'book-1',
                    notes: '   ',
                }),
            ).toEqual({
                book_id: 'book-1',
            })
        })
    })
})
