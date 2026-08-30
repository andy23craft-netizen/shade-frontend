import {
    describe,
    expect,
    it,
} from 'vitest'

import type {
    BookRead,
} from '../../../api/apiTypes'
import {
    hasReadingEditChanges,
    readingEditFormValuesFromBook,
    readingEditFormValuesToRequest,
    validateReadingEditFormValues,
} from './readingEditModel'

const readBook: BookRead = {
    id: 'test-book-id',
    title: 'The Pale Fire',
    authors: [
        {
            author_id: 'author-vladimir-nabokov',
            first_name: 'Vladimir',
            surname: 'Nabokov',
        },
    ],
    isbn13: '9780679723427',
    categories: [{ category_id: 'cat-fiction', name: 'Fiction', slug: 'fiction' }],
    shelf_name: 'a1',
    placement_state: 'shelved',
    status: 'available',
    publication_date: '1962',
    publisher: 'Vintage',
    pages: 315,
    acquisition_source: null,
    purchase_date: null,
    purchase_price: null,
    is_read: true,
    completion_date: '2026-08-10',
    rating: 5,
    review: 'A marvelous book.',
    notes: null,
    tags: null,
    last_borrowed_at: null,
    times_borrowed: 0,
    average_loan_days: null,
    creation_date:
        '2026-08-01T12:00:00.000Z',
    updated_date:
        '2026-08-10T12:00:00.000Z',
}

describe('readingEditModel', () => {
    describe('readingEditFormValuesFromBook', () => {
        it('creates form values from reading fields', () => {
            expect(
                readingEditFormValuesFromBook(
                    readBook,
                ),
            ).toEqual({
                completion_date:
                    '2026-08-10',
                rating: '5',
                review:
                    'A marvelous book.',
            })
        })

        it('uses blank form values for null reading fields', () => {
            expect(
                readingEditFormValuesFromBook({
                    ...readBook,
                    completion_date: null,
                    rating: null,
                    review: null,
                }),
            ).toEqual({
                completion_date: '',
                rating: '',
                review: '',
            })
        })
    })

    describe('validateReadingEditFormValues', () => {
        it('accepts blank nullable fields', () => {
            expect(
                validateReadingEditFormValues({
                    completion_date: '',
                    rating: '',
                    review: '',
                }),
            ).toEqual({})
        })

        it('accepts a valid date and rating', () => {
            expect(
                validateReadingEditFormValues({
                    completion_date:
                        '2026-08-14',
                    rating: '4',
                    review: 'Good.',
                }),
            ).toEqual({})
        })

        it('rejects an impossible completion date', () => {
            expect(
                validateReadingEditFormValues({
                    completion_date:
                        '2026-02-30',
                    rating: '5',
                    review: '',
                }),
            ).toEqual({
                completion_date:
                    'Enter a valid completion date.',
            })
        })

        it.each([
            '0',
            '6',
        ])(
            'rejects out-of-range rating %s',
            (rating) => {
                expect(
                    validateReadingEditFormValues({
                        completion_date: '',
                        rating,
                        review: '',
                    }),
                ).toEqual({
                    rating:
                        'Rating must be from 1 through 5.',
                })
            },
        )

        it.each([
            '1.5',
            '-1',
            'five',
        ])(
            'rejects non-integer rating %s',
            (rating) => {
                expect(
                    validateReadingEditFormValues({
                        completion_date: '',
                        rating,
                        review: '',
                    }),
                ).toEqual({
                    rating:
                        'Rating must be a whole number from 1 through 5.',
                })
            },
        )
    })

    describe('readingEditFormValuesToRequest', () => {
        it('sends no fields when nothing changed', () => {
            expect(
                readingEditFormValuesToRequest(
                    readBook,
                    readingEditFormValuesFromBook(
                        readBook,
                    ),
                ),
            ).toEqual({})
        })

        it('sends only the changed completion date', () => {
            expect(
                readingEditFormValuesToRequest(
                    readBook,
                    {
                        ...readingEditFormValuesFromBook(
                            readBook,
                        ),
                        completion_date:
                            '2026-08-14',
                    },
                ),
            ).toEqual({
                completion_date:
                    '2026-08-14',
            })
        })

        it('sends only the changed rating', () => {
            expect(
                readingEditFormValuesToRequest(
                    readBook,
                    {
                        ...readingEditFormValuesFromBook(
                            readBook,
                        ),
                        rating: '4',
                    },
                ),
            ).toEqual({
                rating: 4,
            })
        })

        it('sends only the changed review', () => {
            expect(
                readingEditFormValuesToRequest(
                    readBook,
                    {
                        ...readingEditFormValuesFromBook(
                            readBook,
                        ),
                        review:
                            'Even better on reflection.',
                    },
                ),
            ).toEqual({
                review:
                    'Even better on reflection.',
            })
        })

        it('sends null when an existing completion date is cleared', () => {
            expect(
                readingEditFormValuesToRequest(
                    readBook,
                    {
                        ...readingEditFormValuesFromBook(
                            readBook,
                        ),
                        completion_date: '',
                    },
                ),
            ).toEqual({
                completion_date: null,
            })
        })

        it('sends null when an existing rating is cleared', () => {
            expect(
                readingEditFormValuesToRequest(
                    readBook,
                    {
                        ...readingEditFormValuesFromBook(
                            readBook,
                        ),
                        rating: '',
                    },
                ),
            ).toEqual({
                rating: null,
            })
        })

        it('sends null when an existing review is cleared', () => {
            expect(
                readingEditFormValuesToRequest(
                    readBook,
                    {
                        ...readingEditFormValuesFromBook(
                            readBook,
                        ),
                        review: '',
                    },
                ),
            ).toEqual({
                review: null,
            })
        })

        it('does not send blank fields that were already null', () => {
            const bookWithNullReadingFields = {
                ...readBook,
                completion_date: null,
                rating: null,
                review: null,
            }

            expect(
                readingEditFormValuesToRequest(
                    bookWithNullReadingFields,
                    readingEditFormValuesFromBook(
                        bookWithNullReadingFields,
                    ),
                ),
            ).toEqual({})
        })

        it('can change and clear different fields in one request', () => {
            expect(
                readingEditFormValuesToRequest(
                    readBook,
                    {
                        completion_date:
                            '2026-08-12',
                        rating: '',
                        review:
                            'Still excellent.',
                    },
                ),
            ).toEqual({
                completion_date:
                    '2026-08-12',
                rating: null,
                review:
                    'Still excellent.',
            })
        })

        it('never includes non-reading BookUpdate fields', () => {
            const request =
                readingEditFormValuesToRequest(
                    readBook,
                    {
                        completion_date:
                            '2026-08-12',
                        rating: '3',
                        review: 'Updated.',
                    },
                )

            expect(request).toEqual({
                completion_date:
                    '2026-08-12',
                rating: 3,
                review: 'Updated.',
            })

            expect(request).not.toHaveProperty(
                'is_read',
            )
            expect(request).not.toHaveProperty(
                'status',
            )
        })
    })

    describe('hasReadingEditChanges', () => {
        it('returns false when nothing changed', () => {
            expect(
                hasReadingEditChanges(
                    readBook,
                    readingEditFormValuesFromBook(
                        readBook,
                    ),
                ),
            ).toBe(false)
        })

        it('returns true when a reading field changed', () => {
            expect(
                hasReadingEditChanges(
                    readBook,
                    {
                        ...readingEditFormValuesFromBook(
                            readBook,
                        ),
                        rating: '4',
                    },
                ),
            ).toBe(true)
        })
    })
})
